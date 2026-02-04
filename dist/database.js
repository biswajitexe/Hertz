"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const keyv_1 = __importDefault(require("keyv"));
const mongo_1 = __importDefault(require("@keyv/mongo"));
class Database {
    constructor() {
        var _a;
        const mongoUrl = (_a = (process.env.MONGO_URL || process.env.MONGO_URI)) === null || _a === void 0 ? void 0 : _a.trim();
        if (mongoUrl) {
            try {
                console.log("DEBUG: Connecting to MongoDB...");
                const store = new mongo_1.default(mongoUrl, { dbName: 'xeon', tls: true });
                this.inner = new keyv_1.default({ store: store, namespace: 'guilds' });
                this.users = new keyv_1.default({ store: store, namespace: 'users' });
                this.inner.on('error', (err) => {
                    console.warn('[Database Warning] MongoDB connection issue. Switching to in-memory storage temporarily.');
                    console.error('Connection Error Detail:', err.message);
                    this.inner = new keyv_1.default();
                    this.users = new keyv_1.default();
                });
            }
            catch (error) {
                console.warn("[Database Warning] Failed to connect to MongoDB. Using in-memory storage.");
                this.inner = new keyv_1.default();
                this.users = new keyv_1.default();
            }
        }
        else {
            console.warn('MONGO_URL not found in .env, falling back to in-memory storage (data will be lost on restart)');
            this.inner = new keyv_1.default();
            this.users = new keyv_1.default();
        }
    }
    defaultGuild(guild) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield this.retrieveGuild(guild.id);
            if (existing)
                return;
            const webhooksWhiteList = [];
            try {
                const webhooks = yield guild.fetchWebhooks();
                for (const webhook of webhooks) {
                    webhooksWhiteList.push(webhook[1].id);
                }
            }
            catch (e) {
                console.warn(`[Database] Failed to fetch webhooks for guild ${guild.id} (Missing Permissions?)`);
            }
            yield this.insertGuild(guild.id, {
                moderators: [],
                antiRaid: false,
                unsafeMode: false,
                webhooksWhitelist: webhooksWhiteList,
                messageFilters: {
                    blacklist: [],
                    discordInvites: false,
                    links: false,
                    spam: false,
                    massMention: false,
                    antiEveryone: false,
                    messages: {
                        blacklist: "{user} This word is not allowed in this server!",
                        discordInvites: "{user} discord invites are not allowed in this server!",
                        links: "{user} links are not allowed in this server!",
                        spam: "{user} Do not spam.",
                    },
                    spamFilter: {},
                    linksWhitelist: { users: [], roles: [], channels: [] },
                    invitesWhitelist: { users: [], roles: [], channels: [] },
                    spamWhitelist: { users: [], roles: [], channels: [] },
                },
                extraOwners: [],
                extraAdmins: [],
                mediaChannels: [],
                warns: {},
                afk: {},
                welcome: {
                    enabled: false,
                    channelId: null,
                    content: null,
                    embed: {
                        author: { name: "Welcome {user.name}!", icon: "{user.avatar}" },
                        title: null,
                        description: "Welcome to {server}. You are member #{memberCount}.",
                        color: 0x5865F2,
                        image: null,
                        thumbnail: null,
                        footer: "{server}",
                        timestamp: true
                    }
                },
                antinuke: {
                    enabled: false,
                    logChannelId: null,
                    limits: {
                        channelDelete: 3, channelCreate: 5, roleDelete: 3, roleCreate: 5, ban: 3, kick: 3,
                    },
                    actions: {
                        channelDelete: 'ban', channelCreate: 'ban', roleDelete: 'ban', roleCreate: 'ban', ban: 'ban', kick: 'ban',
                    }
                },
                reactionRoles: {},
                colorRoles: true,
                raidCache: { bannedUsers: [] },
                banCache: [],
                eventRateCache: new Map(),
                tempBans: [],
                whitelist: { users: [], roles: [], channels: [] },
                customEmbeds: {},
                noPrefixUsers: [],
                autoroles: [],
                autorolesBots: [],
                prefix: null
            });
        });
    }
    insertGuild(id, guild) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.inner.set(id, guild);
        });
    }
    retrieveGuild(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield Promise.race([
                    this.inner.get(id),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 10000))
                ]);
                return result;
            }
            catch (e) {
                console.error(`[Database] Retrieve failed for ${id}: ${e.message}`);
                if (e.message === 'DB_TIMEOUT') {
                    console.warn("[Database] MongoDB is unresponsive. Switched to In-Memory Storage.");
                    this.inner = new keyv_1.default();
                    this.users = new keyv_1.default();
                }
                return undefined;
            }
        });
    }
    removeGuild(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.inner.delete(id);
        });
    }
    getBotConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let config = yield this.inner.get('bot_config');
                if (!config) {
                    config = {
                        maintenance: false,
                        blacklistedUsers: [],
                        blacklistedGuilds: [],
                        premiumUsers: [],
                        premiumGuilds: [],
                        noPrefixUsers: [],
                        staffUsers: [],
                        ownerUsers: [],
                        developerUsers: [],
                        adminUsers: [],
                        supporterUsers: [],
                        vipUsers: [],
                        partnerUsers: [],
                    };
                    yield this.insertBotConfig(config);
                }
                if (!config.noPrefixUsers)
                    config.noPrefixUsers = [];
                if (!config.staffUsers)
                    config.staffUsers = [];
                if (!config.ownerUsers)
                    config.ownerUsers = [];
                if (!config.developerUsers)
                    config.developerUsers = [];
                if (!config.adminUsers)
                    config.adminUsers = [];
                if (!config.supporterUsers)
                    config.supporterUsers = [];
                if (!config.vipUsers)
                    config.vipUsers = [];
                if (!config.partnerUsers)
                    config.partnerUsers = [];
                return config;
            }
            catch (e) {
                console.error(`[Database] Failed to retrieve bot config:`, e);
                return {
                    maintenance: false,
                    blacklistedUsers: [],
                    blacklistedGuilds: [],
                    premiumUsers: [],
                    premiumGuilds: [],
                    noPrefixUsers: [],
                    staffUsers: [],
                    ownerUsers: [],
                    developerUsers: [],
                    adminUsers: [],
                    supporterUsers: [],
                    vipUsers: [],
                    partnerUsers: []
                };
            }
        });
    }
    updateBotConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.insertBotConfig(config);
        });
    }
    insertBotConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.inner.set('bot_config', config);
        });
    }
    getUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield this.users.get(id);
            if (!user) {
                user = {
                    id: id,
                    bio: null,
                    reps: 0,
                    lastRepDate: 0,
                    partnerId: null,
                    marryDate: null,
                    color: null
                };
                yield this.updateUser(user);
            }
            return user;
        });
    }
    updateUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.users.set(user.id, user);
        });
    }
}
exports.Database = Database;
