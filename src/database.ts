import type { Guild as DiscordGuild } from "discord.js";
import Keyv from "keyv";
import * as fs from 'fs';

/* Stores all the data that needs to be cached when anti-raid mode is turned on */
export interface RaidCache {
    bannedUsers: string[],
}

export type SpamFilter = Record<string, unknown>;

export interface MessageFilter {
    blacklist: string[],
    discordInvites: boolean,
    links: boolean,
    spam: boolean,
    massMention: boolean,
    antiEveryone: boolean,

    /* The messages to send when a message is deleted */
    messages: {
        blacklist: string,
        discordInvites: string,
        links: string,
        spam: string,
    },

    spamFilter: SpamFilter,

    // Granular Whitelists
    linksWhitelist: { users: string[], roles: string[], channels: string[] },
    invitesWhitelist: { users: string[], roles: string[], channels: string[] },
    spamWhitelist: { users: string[], roles: string[], channels: string[] },
}

export interface WelcomeConfig {
    enabled: boolean;
    channelId: string | null;
    content: string | null;
    embed: {
        author: {
            name: string | null;
            icon: string | null;
        };
        title: string | null;
        description: string | null;
        color: number | null;
        image: string | null;
        thumbnail: string | null;
        footer: string | null;
        timestamp: boolean;
        buttons?: { label: string, url: string }[];
    };
}

/* Represents a discord guild and is used in the database */
export interface Guild {
    moderators: string[],

    antiRaid: boolean,
    unsafeMode: boolean,

    webhooksWhitelist: string[],
    messageFilters: MessageFilter,
    extraOwners: string[],
    extraAdmins: string[],
    mediaChannels: string[],
    warns: { [userId: string]: { id: string, moderatorId: string, reason: string, timestamp: number }[] },
    afk: { [userId: string]: { reason: string, timestamp: number } },
    welcome: WelcomeConfig,

    antinuke: {
        enabled: boolean,
        logChannelId: string | null,
        limits: {
            channelDelete: number,
            channelCreate: number,
            roleDelete: number,
            roleCreate: number,
            ban: number,
            kick: number,
        },
        actions: {
            channelDelete: 'ban' | 'kick' | 'warn',
            channelCreate: 'ban' | 'kick' | 'warn',
            roleDelete: 'ban' | 'kick' | 'warn',
            roleCreate: 'ban' | 'kick' | 'warn',
            ban: 'ban' | 'kick' | 'warn',
            kick: 'ban' | 'kick' | 'warn',
        }
    },

    reactionRoles: { [messageId: string]: { channelId: string, type: 'panel' | 'color', roles: string[] } },
    colorRoles: boolean, // Enabled/Disabled

    raidCache: RaidCache,
    banCache: string[],
    eventRateCache: Map<string, number>,

    /* New Advanced Ban Features */
    tempBans: { userId: string, endTime: number, moderatorId: string, reason: string }[],


    // Custom Embeds Storage
    customEmbeds: { [name: string]: Record<string, unknown> }, // Stores JSON embed objects

    // Legacy whitelist (Deprecated) - Keeping for potential compilation errors until fully migrated
    whitelist?: {
        users: string[],
        roles: string[],
        channels: string[]
    },

    noPrefixUsers: string[]; // Server-scoped No Prefix Users
    autoroles: string[];
    autorolesBots: string[];
    prefix: string | null;
}

/* Global Bot Configuration */
export interface BotConfig {
    maintenance: boolean;
    blacklistedUsers: string[];
    blacklistedGuilds: string[];
    premiumUsers: string[];
    premiumGuilds: string[];
    noPrefixUsers: string[]; // Global No Prefix Users
    staffUsers: string[]; // Bot Staff Members
    ownerUsers: string[]; // Bot Owners
    developerUsers: string[]; // Bot Developers
    adminUsers: string[]; // Bot Admins
    supporterUsers: string[]; // Bot Supporters
    vipUsers: string[]; // Bot VIPs
    partnerUsers: string[]; // Bot Partners
}

/* User Profile Schema */
export interface UserProfile {
    id: string;
    bio: string | null;
    reps: number;
    lastRepDate: number;
    partnerId: string | null;
    marryDate: number | null;
    color: number | null; // Custom Embed Color
}

import KeyvMongo from '@keyv/mongo';
// @ts-ignore
import KeyvPostgres from '@keyv/postgres';

export class Database {
    inner: Keyv<Guild>
    users: Keyv<UserProfile>
    private guildCache = new Map<string, Guild>();
    private userCache = new Map<string, UserProfile>();
    private botConfigCache: BotConfig | null = null;
    private isStoreConnected = true;

    constructor() {
        const dbUrl = (process.env.DATABASE || process.env.MONGO_URL || process.env.MONGO_URI || process.env.MONGODB_URI)?.trim();
        if (dbUrl) {
            try {
                let store: any;
                if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
                    console.log("DEBUG: Connecting to PostgreSQL (Supabase)...");
                    const PostgresAdapter = (KeyvPostgres as any).default || KeyvPostgres;
                    store = new PostgresAdapter({ uri: dbUrl, table: 'keyv_store', connectionTimeoutMillis: 2000 });
                } else {
                    console.log("DEBUG: Connecting to MongoDB...");
                    store = new KeyvMongo(dbUrl, { dbName: process.env.DB_NAME || 'hertz', tls: true });
                }

                if (store && typeof store.on === 'function') {
                    store.on('error', (err: any) => {
                        console.warn('[Database] Store connection issue:', err.message);
                        this.isStoreConnected = false;
                    });
                }

                this.inner = new Keyv({ store: store, namespace: 'guilds' });
                this.users = new Keyv({ store: store, namespace: 'users' });

                this.inner.on('error', (err: any) => {
                    console.warn('[Database Warning] Connection issue. Fast fallback active.');
                    this.isStoreConnected = false;
                });

            } catch (err: any) {
                console.warn("[Database Warning] Failed to initialize database adapter. Using in-memory storage.");
                this.isStoreConnected = false;
                this.inner = new Keyv();
                this.users = new Keyv();
            }
        } else {
            console.warn('Database URL not found in .env, falling back to in-memory storage');
            this.isStoreConnected = false;
            this.inner = new Keyv();
            this.users = new Keyv();
        }
    }

    async defaultGuild(guild: DiscordGuild) {
        const existing = await this.retrieveGuild(guild.id);
        if (existing) return;

        const webhooksWhiteList: string[] = [];

        /* All webhooks when the bot is added to the guild are whitelisted */
        try {
            const webhooks = await guild.fetchWebhooks();
            for (const webhook of webhooks) {
                webhooksWhiteList.push(webhook[1].id);
            }
        } catch {
            console.warn(`[Database] Failed to fetch webhooks for guild ${guild.id} (Missing Permissions?)`);
        }

        await this.insertGuild(guild.id, {
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
    }

    async insertGuild(id: string, guild: Guild) {
        this.guildCache.set(id, guild);
        this.inner.set(id, guild).catch(() => {});
    }

    async retrieveGuild(id: string): Promise<Guild | undefined> {
        if (this.guildCache.has(id)) {
            return this.guildCache.get(id);
        }

        if (!this.isStoreConnected) {
            return undefined;
        }

        try {
            const result = await Promise.race([
                this.inner.get(id),
                new Promise<undefined>((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 800))
            ]);
            if (result) {
                this.guildCache.set(id, result);
            }
            return result;
        } catch (e: any) {
            if (e.message === 'DB_TIMEOUT') {
                this.isStoreConnected = false;
            }
            return undefined;
        }
    }

    async removeGuild(id: string) {
        this.guildCache.delete(id);
        this.inner.delete(id).catch(() => {});
    }

    /* Global Config Methods */
    async getBotConfig(): Promise<BotConfig> {
        if (this.botConfigCache) {
            return this.botConfigCache;
        }

        const defaultConfig: BotConfig = {
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

        if (!this.isStoreConnected) {
            this.botConfigCache = defaultConfig;
            return defaultConfig;
        }

        try {
            let config = await Promise.race([
                this.inner.get('bot_config'),
                new Promise<undefined>((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 800))
            ]) as unknown as BotConfig | undefined;

            if (!config) {
                config = defaultConfig;
                this.insertBotConfig(config).catch(() => {});
            }
            if (!config.noPrefixUsers) config.noPrefixUsers = [];
            if (!config.staffUsers) config.staffUsers = [];
            if (!config.ownerUsers) config.ownerUsers = [];
            if (!config.developerUsers) config.developerUsers = [];
            if (!config.adminUsers) config.adminUsers = [];
            if (!config.supporterUsers) config.supporterUsers = [];
            if (!config.vipUsers) config.vipUsers = [];
            if (!config.partnerUsers) config.partnerUsers = [];

            this.botConfigCache = config;
            return config;
        } catch (e) {
            this.botConfigCache = defaultConfig;
            return defaultConfig;
        }
    }

    async updateBotConfig(config: BotConfig) {
        await this.insertBotConfig(config);
    }

    async insertBotConfig(config: BotConfig) {
        this.botConfigCache = config;
        this.inner.set('bot_config', config).catch(() => {});
    }

    /* User Profile Methods */
    async retrieveUser(id: string): Promise<UserProfile | undefined> {
        if (this.userCache.has(id)) {
            return this.userCache.get(id);
        }
        if (!this.isStoreConnected) {
            return undefined;
        }
        try {
            const result = await Promise.race([
                this.users.get(id),
                new Promise<undefined>((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 800))
            ]);
            if (result) {
                this.userCache.set(id, result);
            }
            return result;
        } catch {
            return undefined;
        }
    }

    async getUser(id: string): Promise<UserProfile> {
        let user = await this.retrieveUser(id);
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
            await this.updateUser(user);
        }
        return user;
    }

    async updateUser(user: UserProfile) {
        this.userCache.set(user.id, user);
        this.users.set(user.id, user).catch(() => {});
    }
}