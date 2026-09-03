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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
console.log(`[DEBUG] Starting bot process... PID: ${process.pid} | Instance: ${Math.floor(Math.random() * 10000)}`);
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3000;
app.get('/', (req, res) => {
    res.send('Hertz is Online!');
});
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        bot: 'Hertz',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});
app.listen(port, '0.0.0.0', () => {
    console.log(`[Express] Render Web Service keeping alive on 0.0.0.0:${port}`);
});
const logging_1 = require("./logging");
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
process.on('unhandledRejection', (reason, p) => {
    console.error('[Anti-Crash] Unhandled Rejection/Catch');
    console.error(reason, p);
});
process.on('uncaughtException', (err, origin) => {
    console.error('[Anti-Crash] Uncaught Exception/Catch');
    console.error(err, origin);
});
const token = (_a = process.env.DISCORD_TOKEN) === null || _a === void 0 ? void 0 : _a.trim();
if (!token) {
    console.error("❌ CRITICAL ERROR: DISCORD_TOKEN is missing from Environment Variables!");
    console.error(">>> Please add 'DISCORD_TOKEN' to your hosting environment settings.");
    process.exit(1);
}
const discord_js_1 = require("discord.js");
const database_1 = require("./database");
const GiveawayHandler_1 = require("./structures/GiveawayHandler");
const SnipeManager_1 = require("./structures/SnipeManager");
const messages_1 = require("./utilities/messages");
const config_1 = require("./config");
const componentV2_1 = require("./utilities/componentV2");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildWebhooks,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildPresences
    ],
    partials: [discord_js_1.Partials.Channel]
});
const database = new database_1.Database();
const commandHandler = new discord_js_1.Collection();
const spamCache = new Map();
const linksRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
function registerCommands(dir) {
    const commandFiles = fs_1.default.readdirSync(dir).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    for (const file of commandFiles) {
        const data = require(path_1.default.join(dir, file));
        commandHandler.set(data.command.name, data);
        if (data.aliases && Array.isArray(data.aliases)) {
            for (const alias of data.aliases) {
                commandHandler.set(alias, data);
            }
        }
    }
    const commandFolders = fs_1.default.readdirSync(dir)
        .filter(file => fs_1.default.lstatSync(path_1.default.join(dir, file)).isDirectory());
    for (const commandFolder of commandFolders) {
        registerCommands(path_1.default.join(dir, commandFolder));
    }
}
client.once("ready", (client) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    const commandsPath = path_1.default.resolve(__dirname, "commands");
    const commandFiles = fs_1.default.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
    registerCommands(path_1.default.join(__dirname, "commands"));
    for (const guild of client.guilds.cache.values()) {
        yield database.defaultGuild(guild);
    }
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        for (const guild of client.guilds.cache.values()) {
            const data = yield database.retrieveGuild(guild.id);
            if (!data || !data.tempBans || data.tempBans.length === 0)
                continue;
            const now = Date.now();
            const expiredBans = data.tempBans.filter(ban => ban.endTime <= now);
            if (expiredBans.length > 0) {
                data.tempBans = data.tempBans.filter(ban => ban.endTime > now);
                yield database.insertGuild(guild.id, data);
                for (const ban of expiredBans) {
                    try {
                        yield guild.members.unban(ban.userId, `Temp ban expired. (Original reason: ${ban.reason})`);
                    }
                    catch (e) {
                        console.error(`Failed to unban user ${ban.userId} in guild ${guild.id}:`, e);
                    }
                }
            }
        }
    }), 60 * 1000);
    (0, logging_1.log)(`b{ Logged in as ${client.user.username}.}`);
    console.log("[DEBUG] Active Intents:", client.options.intents);
    console.log("[DEBUG] Welcomer Commands Loaded:", JSON.stringify(require('./config').modules.welcomer.commands.map((c) => c.name), null, 2));
    GiveawayHandler_1.giveawayHandler.init(client);
    const { AntinukeManager } = require("./features/antinuke/Manager");
    new AntinukeManager(client, database);
    client.user.setPresence({
        status: 'dnd',
        activities: [{
                name: 'Server Security | ?help',
                type: discord_js_1.ActivityType.Watching
            }]
    });
}));
client.on("guildMemberAdd", (member) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let guild = yield database.retrieveGuild(member.guild.id);
    if (!guild)
        return;
    const rolesToAdd = member.user.bot ? (guild.autorolesBots || []) : (guild.autoroles || []);
    if (rolesToAdd.length > 0) {
        try {
            const validRoles = rolesToAdd.filter(roleId => member.guild.roles.cache.has(roleId));
            if (validRoles.length > 0) {
                yield member.roles.add(validRoles, "Autorole on Join").catch(e => console.error(`[Autorole] Failed to add roles to ${member.user.tag} in ${member.guild.name}:`, e));
            }
        }
        catch (e) {
            console.error(`[Autorole] Error in guild ${member.guild.id}:`, e);
        }
    }
    if (guild.welcome && guild.welcome.enabled && guild.welcome.channelId) {
        const channel = member.guild.channels.cache.get(guild.welcome.channelId);
        if (channel && channel.isTextBased()) {
            const conf = guild.welcome;
            const parse = (str) => {
                return str
                    .replace(/{user}/g, `<@${member.id}>`)
                    .replace(/{user.tag}/g, member.user.tag)
                    .replace(/{user.name}/g, member.user.username)
                    .replace(/{user.id}/g, member.id)
                    .replace(/{server}/g, member.guild.name)
                    .replace(/{memberCount}/g, member.guild.memberCount.toString())
                    .replace(/{user.icon}/g, member.user.displayAvatarURL())
                    .replace(/{user.avatar}/g, member.user.displayAvatarURL())
                    .replace(/{server.icon}/g, member.guild.iconURL() || "")
                    .replace(/{server.banner}/g, member.guild.bannerURL() || "");
            };
            const embed = new componentV2_1.V2Embed();
            let hasEmbed = false;
            if ((_a = conf.embed.author) === null || _a === void 0 ? void 0 : _a.name) {
                embed.setAuthor(parse(conf.embed.author.name), conf.embed.author.icon ? parse(conf.embed.author.icon) : undefined);
                hasEmbed = true;
            }
            if (conf.embed.title) {
                embed.setTitle(parse(conf.embed.title));
                hasEmbed = true;
            }
            if (conf.embed.description) {
                embed.setDescription(parse(conf.embed.description));
                hasEmbed = true;
            }
            if (conf.embed.color) {
                embed.setColor(conf.embed.color);
                hasEmbed = true;
            }
            if (conf.embed.image) {
                embed.setImage(parse(conf.embed.image));
                hasEmbed = true;
            }
            let thumb = conf.embed.thumbnail;
            if (thumb === '{user.avatar}')
                thumb = member.user.displayAvatarURL();
            else if (thumb)
                thumb = parse(thumb);
            if (thumb) {
                embed.setThumbnail(thumb);
                hasEmbed = true;
            }
            if (conf.embed.footer) {
                embed.setFooter(parse(conf.embed.footer));
                hasEmbed = true;
            }
            if (conf.embed.timestamp) {
                embed.setTimestamp();
                hasEmbed = true;
            }
            if (hasEmbed) {
                if (conf.content) {
                    embed.setDescription(`${parse(conf.content)}\n\n${conf.embed.description ? parse(conf.embed.description) : ""}`.trim());
                }
                yield channel.send(embed.toPayload()).catch(console.error);
            }
            else if (conf.content) {
                const textEmbed = new componentV2_1.V2Embed().setDescription(parse(conf.content));
                yield channel.send(textEmbed.toPayload()).catch(console.error);
            }
        }
    }
}));
client.on("guildBanAdd", (ban) => __awaiter(void 0, void 0, void 0, function* () {
    let guild = yield database.retrieveGuild(ban.guild.id);
    if (!guild)
        return;
    if (!guild.raidCache.bannedUsers.includes(ban.user.id)) {
        guild.banCache.push(ban.user.id);
        database.insertGuild(ban.guild.id, guild);
    }
}));
client.on("channelCreate", (channel) => __awaiter(void 0, void 0, void 0, function* () {
    if (channel.isDMBased())
        return;
    let guild = yield database.retrieveGuild(channel.guild.id);
    if (!guild)
        return;
    if (guild.antiRaid)
        yield channel.delete("[AutoMod] Anti-raid was enabled.");
}));
client.on("roleCreate", (role) => __awaiter(void 0, void 0, void 0, function* () {
    let guild = yield database.retrieveGuild(role.guild.id);
    if (!guild)
        return;
    if (guild.antiRaid)
        yield role.delete("[AutoMod] Anti-raid was enabled.");
}));
client.on("guildCreate", (guild) => __awaiter(void 0, void 0, void 0, function* () { return yield database.defaultGuild(guild); }));
client.on("guildDelete", (guild) => __awaiter(void 0, void 0, void 0, function* () { return yield database.removeGuild(guild.id); }));
client.on("messageCreate", (message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    if (message.author.bot || !message.guild)
        return;
    try {
        fs_1.default.appendFileSync('debug.log', `[DEBUG] [PID:${process.pid}] Processing: '${message.content}' | Prefix loaded: '${config_1.prefix}'\n`);
    }
    catch (e) { }
    console.log(`[DEBUG] User Message: '${message.content}' | Command 'antilink' loaded: ${commandHandler.has('antilink')}`);
    if (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) {
        const guildData = yield database.retrieveGuild(message.guild.id);
        const currentPrefix = (guildData === null || guildData === void 0 ? void 0 : guildData.prefix) || config_1.prefix;
        const embed = new componentV2_1.V2Embed()
            .setColor(0x5865F2)
            .setAuthor("Hertz Security", client.user.displayAvatarURL())
            .setTitle("Hey there! I'm Hertz.")
            .setDescription(`**I am a powerful security and moderation bot designed to protect your server.**\n\nType \`${currentPrefix}help\` to see my commands!`)
            .setFooter("Protected by Hertz Security System", message.guild.iconURL() || undefined)
            .setTimestamp();
        const inviteBtn = new discord_js_1.ButtonBuilder()
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setLabel("Invite Me")
            .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`);
        const row = new discord_js_1.ActionRowBuilder().addComponents(inviteBtn);
        yield message.reply(embed.toPayload({ extraComponents: [row] }));
        return;
    }
    const guildData = yield database.retrieveGuild(message.guild.id);
    if (guildData) {
        if (guildData.afk[message.author.id]) {
            const afkData = guildData.afk[message.author.id];
            delete guildData.afk[message.author.id];
            yield database.insertGuild(message.guild.id, guildData);
            const diff = Date.now() - afkData.timestamp;
            const minutes = Math.floor((diff / 1000) / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            let duration = "";
            if (days > 0)
                duration = `${days} days, ${hours % 24} hrs`;
            else if (hours > 0)
                duration = `${hours} hrs, ${minutes % 60} min`;
            else if (minutes > 0)
                duration = `${minutes} min, ${Math.floor((diff / 1000) % 60)} sec`;
            else
                duration = "a few seconds";
            const afkEmbed = new componentV2_1.V2Embed()
                .setColor(0x00AAFF)
                .setDescription(`<:6858aventurinebye:1464310768366522616> **Welcome back, ${message.author.username}!**\nAFK removed. \`${duration}\``);
            yield message.reply(afkEmbed.toPayload())
                .then(m => setTimeout(() => m.delete().catch(() => { }), 30000));
        }
        if (message.mentions.members && message.mentions.members.size > 0) {
            const afkMembers = [];
            message.mentions.members.forEach(m => {
                if (guildData.afk[m.id]) {
                    const data = guildData.afk[m.id];
                    const time = Math.floor(data.timestamp / 1000);
                    afkMembers.push(`${m.user.username} is AFK: **${data.reason}** (<t:${time}:R>)`);
                }
            });
            if (afkMembers.length > 0) {
                const embed = new componentV2_1.V2Embed()
                    .setColor(config_1.colors.primary)
                    .setDescription(afkMembers.join("\n"));
                yield message.reply(embed.toPayload());
            }
        }
    }
    let guild = guildData;
    if (!guild) {
        try {
            yield database.defaultGuild(message.guild);
            guild = yield database.retrieveGuild(message.guildId);
        }
        catch (e) {
            console.error(`[Database] Failed to create default guild: ${e.message}`);
        }
        if (!guild)
            return;
    }
    if (guild === null || guild === void 0 ? void 0 : guild.messageFilters.discordInvites) {
        const inviteRegex = /(discord.gg\/|discord.com\/invite\/|discordapp.com\/invite\/)/i;
        if (message.content.search(inviteRegex) >= 0) {
            let isWhitelisted = false;
            if (guild.messageFilters.invitesWhitelist) {
                const wl = guild.messageFilters.invitesWhitelist;
                const isWhitelistedUser = wl.users.includes(message.author.id);
                const isWhitelistedRole = (_a = message.member) === null || _a === void 0 ? void 0 : _a.roles.cache.some(r => wl.roles.includes(r.id));
                const isWhitelistedChannel = wl.channels.includes(message.channel.id);
                const isAdmin = (_b = message.member) === null || _b === void 0 ? void 0 : _b.permissions.has("Administrator");
                if (isWhitelistedUser || isWhitelistedRole || isWhitelistedChannel || isAdmin)
                    isWhitelisted = true;
            }
            if (!isWhitelisted) {
                yield message.delete().catch(() => { });
                const msg = yield message.channel.send(`${config_1.emojis.links} <@${message.author.id}> **Discord Invites are not allowed in this server!**`);
                setTimeout(() => msg.delete().catch(() => { }), 5000);
                return;
            }
        }
    }
    if (guild === null || guild === void 0 ? void 0 : guild.messageFilters.links) {
        if (message.content.search(linksRegex) >= 0) {
            let isWhitelisted = false;
            const internalLink = message.guild.id;
            const trustedDomains = [
                "youtube.com", "youtu.be",
                "spotify.com", "open.spotify.com",
                "tenor.com", "giphy.com",
                "discord.com/channels"
            ];
            if (message.content.includes(internalLink))
                isWhitelisted = true;
            if (trustedDomains.some(domain => message.content.toLowerCase().includes(domain)))
                isWhitelisted = true;
            if (guild.messageFilters.linksWhitelist) {
                const wl = guild.messageFilters.linksWhitelist;
                const isWhitelistedUser = wl.users.includes(message.author.id);
                const isWhitelistedRole = (_c = message.member) === null || _c === void 0 ? void 0 : _c.roles.cache.some(r => wl.roles.includes(r.id));
                const isWhitelistedChannel = wl.channels.includes(message.channel.id);
                const isAdmin = (_d = message.member) === null || _d === void 0 ? void 0 : _d.permissions.has("Administrator");
                if (isWhitelistedUser || isWhitelistedRole || isWhitelistedChannel || isAdmin)
                    isWhitelisted = true;
            }
            if (!isWhitelisted) {
                yield message.delete().catch(() => { });
                const msg = yield message.channel.send(`${config_1.emojis.links} <@${message.author.id}> **Links are not allowed in this server!**`);
                setTimeout(() => msg.delete().catch(() => { }), 5000);
                return;
            }
        }
    }
    if (guild === null || guild === void 0 ? void 0 : guild.messageFilters.antiEveryone) {
        if (message.content.includes('@everyone') || message.content.includes('@here')) {
            const isAdmin = (_e = message.member) === null || _e === void 0 ? void 0 : _e.permissions.has("Administrator");
            let isWhitelisted = isAdmin;
            if (guild.messageFilters.spamWhitelist) {
                const wl = guild.messageFilters.spamWhitelist;
                if (wl.users.includes(message.author.id) ||
                    ((_f = message.member) === null || _f === void 0 ? void 0 : _f.roles.cache.some(r => wl.roles.includes(r.id))) ||
                    wl.channels.includes(message.channel.id)) {
                    isWhitelisted = true;
                }
            }
            if (!isWhitelisted) {
                yield message.delete().catch(() => { });
                const msg = yield message.channel.send(`${config_1.emojis.error} <@${message.author.id}> **You are not allowed to mention everyone/here!**`);
                setTimeout(() => msg.delete().catch(() => { }), 5000);
                return;
            }
        }
    }
    if (guild === null || guild === void 0 ? void 0 : guild.messageFilters.massMention) {
        const mentionLimit = 7;
        if (message.mentions.users.size > mentionLimit) {
            const isAdmin = (_g = message.member) === null || _g === void 0 ? void 0 : _g.permissions.has("Administrator");
            let isWhitelisted = isAdmin;
            if (guild.messageFilters.spamWhitelist) {
                const wl = guild.messageFilters.spamWhitelist;
                if (wl.users.includes(message.author.id) ||
                    ((_h = message.member) === null || _h === void 0 ? void 0 : _h.roles.cache.some(r => wl.roles.includes(r.id))) ||
                    wl.channels.includes(message.channel.id)) {
                    isWhitelisted = true;
                }
            }
            if (!isWhitelisted) {
                yield message.delete().catch(() => { });
                if (message.member && message.member.moderatable) {
                    yield message.member.timeout(10 * 60 * 1000, "Anti-Spam: Mass Mention").catch(() => { });
                }
                const msg = yield message.channel.send(`${config_1.emojis.error} <@${message.author.id}> **Don't mass mention users!** (Muted for 10m)`);
                setTimeout(() => msg.delete().catch(() => { }), 5000);
                return;
            }
        }
    }
    if (guild === null || guild === void 0 ? void 0 : guild.messageFilters.spam) {
        let isWhitelisted = false;
        if (guild.messageFilters.spamWhitelist) {
            const wl = guild.messageFilters.spamWhitelist;
            const isWhitelistedUser = wl.users.includes(message.author.id);
            const isWhitelistedRole = (_j = message.member) === null || _j === void 0 ? void 0 : _j.roles.cache.some(r => wl.roles.includes(r.id));
            const isWhitelistedChannel = wl.channels.includes(message.channel.id);
            const isAdmin = (_k = message.member) === null || _k === void 0 ? void 0 : _k.permissions.has("Administrator");
            if (isWhitelistedUser || isWhitelistedRole || isWhitelistedChannel || isAdmin) {
                isWhitelisted = true;
            }
        }
        if (isWhitelisted) {
        }
        else {
            const now = Date.now();
            const userKey = `${message.guildId}_${message.author.id}`;
            let msgScore = 1;
            if (message.content.search(linksRegex) > 0)
                msgScore += 3;
            if (message.mentions.users.size > 0)
                msgScore += 4;
            if (message.attachments.size > 0)
                msgScore += 2;
            if (!spamCache.has(userKey)) {
                spamCache.set(userKey, { score: msgScore, lastMessage: message.content, lastTimestamp: now });
            }
            else {
                const data = spamCache.get(userKey);
                if (now - data.lastTimestamp > 5000) {
                    data.score = msgScore;
                    data.lastTimestamp = now;
                    data.lastMessage = message.content;
                }
                else {
                    data.score += msgScore;
                    if (message.content === data.lastMessage && message.content.length > 5) {
                        data.score += 2;
                    }
                    data.lastMessage = message.content;
                }
                spamCache.set(userKey, data);
                if (data.score >= 7) {
                    try {
                        fs_1.default.appendFileSync('debug.log', `[DEBUG] Filter: Spam Triggered\n`);
                    }
                    catch (_v) { }
                    yield message.delete().catch(() => { });
                    if (data.score <= 10) {
                        const warningMsg = yield message.channel.send(`${config_1.emojis.warning} <@${message.author.id}> **Stop spamming!**\nYour messages are being flagged as spam.`);
                        setTimeout(() => warningMsg.delete().catch(() => { }), 3000);
                    }
                    if (data.score >= 12) {
                        if (message.member && message.member.moderatable) {
                            yield message.member.timeout(10 * 60 * 1000, "Anti-Spam: Weighted Score Limit Exceeded");
                            const muteMsg = yield message.channel.send(`${config_1.emojis.error} **${message.author.tag}** has been muted for 10 minutes.`);
                            setTimeout(() => muteMsg.delete().catch(() => { }), 5000);
                            spamCache.delete(userKey);
                        }
                    }
                    return;
                }
            }
        }
    }
    else {
    }
    if ((0, messages_1.isBadMessage)(message.content, (guild === null || guild === void 0 ? void 0 : guild.messageFilters.blacklist) ? guild.messageFilters.blacklist : [])) {
        if (!((_l = message.member) === null || _l === void 0 ? void 0 : _l.permissions.has("Administrator"))) {
            yield message.delete();
            yield message.channel.send((0, messages_1.replaceValues)(guild === null || guild === void 0 ? void 0 : guild.messageFilters.messages.blacklist, message));
            return;
        }
    }
    if (guild === null || guild === void 0 ? void 0 : guild.mediaChannels.includes(message.channel.id)) {
        const hasMedia = message.attachments.size > 0 || message.content.search(linksRegex) > 0;
        const hasPerms = (_m = message.member) === null || _m === void 0 ? void 0 : _m.permissions.has("ManageMessages");
        if (!hasMedia && !hasPerms) {
            yield message.delete().catch(() => { });
            const warning = yield message.channel.send(`${config_1.emojis.warning} <@${message.author.id}> This is a media-only channel!`);
            setTimeout(() => warning.delete().catch(() => { }), 5000);
            return;
        }
    }
    console.log("[DEBUG] Checking Filters...");
    const currentPrefix = (guild === null || guild === void 0 ? void 0 : guild.prefix) || config_1.prefix;
    let commandName;
    let args = [];
    let isNoPrefixAction = false;
    const botConfig = yield database.getBotConfig();
    if (message.content.startsWith(currentPrefix)) {
        args = message.content.slice(currentPrefix.length).trim().split(/ +/);
        commandName = (_o = args.shift()) === null || _o === void 0 ? void 0 : _o.toLowerCase();
    }
    else if ((_p = botConfig.noPrefixUsers) === null || _p === void 0 ? void 0 : _p.includes(message.author.id)) {
        const tempArgs = message.content.trim().split(/ +/);
        const tempCommandName = tempArgs[0].toLowerCase();
        if (commandHandler.has(tempCommandName)) {
            args = tempArgs;
            commandName = (_q = args.shift()) === null || _q === void 0 ? void 0 : _q.toLowerCase();
            isNoPrefixAction = true;
        }
    }
    if (commandName) {
        const botConfig = yield database.getBotConfig();
        const isOwner = message.author.id === process.env.OWNER_ID;
        if (botConfig.blacklistedUsers.includes(message.author.id) && !isOwner)
            return;
        const isStaff = (_r = botConfig.staffUsers) === null || _r === void 0 ? void 0 : _r.includes(message.author.id);
        const isDev = (_s = botConfig.developerUsers) === null || _s === void 0 ? void 0 : _s.includes(message.author.id);
        if (botConfig.maintenance && !isOwner && !isDev && !isStaff)
            return;
        fs_1.default.appendFileSync('debug.log', `[DEBUG] Command matched: ${commandName}\n`);
        if (commandName === 'help') {
            const helpArgs = args[0] ? args[0].toLowerCase() : null;
            if (helpArgs) {
            }
        }
        if (commandName === 'help' && !args.length) {
        }
        const commandModule = commandHandler.get(commandName);
        console.log(`[DEBUG] Handling command: '${commandName}'. Module found: ${!!commandModule}`);
        if (commandModule) {
            fs_1.default.appendFileSync('debug.log', `[DEBUG] Module found for: ${commandName}\n`);
            console.log(`[PrefixHandler] Found module for: ${commandName}`);
            try {
                const { command, run } = commandModule;
                let commandData;
                try {
                    commandData = typeof command.toJSON === 'function' ? command.toJSON() : command;
                }
                catch (e) {
                    commandData = { options: [] };
                }
                const rawOptions = commandData.options || [];
                console.log(`[Debug] Command Options (JSON):`, rawOptions.length);
                const optionsMap = new Map();
                let subcommandName = null;
                let groupName = null;
                let currentArgIndex = 0;
                const subcommands = rawOptions.filter((opt) => opt.type === 1 || opt.type === 2);
                let targetOptions = rawOptions;
                if (subcommands.length > 0 && args.length > 0) {
                    const potentialMatch = subcommands.find((s) => s.name === args[0].toLowerCase());
                    if (potentialMatch) {
                        currentArgIndex++;
                        if (potentialMatch.type === 2) {
                            groupName = potentialMatch.name;
                            const internalSubcommands = potentialMatch.options || [];
                            if (currentArgIndex < args.length) {
                                const subMatch = internalSubcommands.find((s) => s.name === args[currentArgIndex].toLowerCase());
                                if (subMatch) {
                                    subcommandName = subMatch.name;
                                    targetOptions = subMatch.options || [];
                                    currentArgIndex++;
                                }
                            }
                        }
                        else {
                            subcommandName = potentialMatch.name;
                            targetOptions = potentialMatch.options || [];
                        }
                        for (const opt of targetOptions) {
                            if (currentArgIndex >= args.length)
                                break;
                            let val = args[currentArgIndex];
                            if (opt.type === 3 && targetOptions.indexOf(opt) === targetOptions.length - 1) {
                                val = args.slice(currentArgIndex).join(" ");
                                currentArgIndex = args.length;
                            }
                            else {
                                if (opt.type === 7)
                                    val = val.replace(/<#|>/g, '');
                                val = val.replace(/[<@!&>]/g, '');
                                currentArgIndex++;
                            }
                            optionsMap.set(opt.name, val);
                        }
                    }
                }
                if (!subcommandName && !groupName) {
                    const topOptions = rawOptions.filter((opt) => opt.type !== 1 && opt.type !== 2);
                    const skippedIntOptions = [];
                    for (const opt of topOptions) {
                        if (currentArgIndex >= args.length)
                            break;
                        let val = args[currentArgIndex];
                        if ((opt.type === 4 || opt.type === 10) && isNaN(parseInt(val))) {
                            if (!opt.required) {
                                console.log(`[SmartParse] Skipping option '${opt.name}' (Expected Int, got '${val}')`);
                                skippedIntOptions.push(opt);
                                continue;
                            }
                        }
                        if (opt.type === 6 && (val.toLowerCase() === 'bot' || val.toLowerCase() === 'bots')) {
                            if (!opt.required) {
                                console.log(`[SmartParse] Skipping option '${opt.name}' (got keyword '${val}')`);
                                continue;
                            }
                        }
                        if (opt.type === 3 && topOptions.indexOf(opt) === topOptions.length - 1) {
                            val = args.slice(currentArgIndex).join(" ");
                            currentArgIndex = args.length;
                        }
                        else {
                            if (opt.type === 7)
                                val = val.replace(/<#|>/g, '');
                            val = val.replace(/[<@!&>]/g, '');
                            try {
                                if (message.guild) {
                                    if (opt.type === 6)
                                        yield message.guild.members.fetch(val).catch(() => { });
                                    if (opt.type === 9 || opt.type === 8)
                                        yield message.guild.roles.fetch(val).catch(() => { });
                                }
                                yield message.client.users.fetch(val).catch(() => { });
                            }
                            catch (e) { }
                            currentArgIndex++;
                        }
                        optionsMap.set(opt.name, val);
                    }
                    while (currentArgIndex < args.length && skippedIntOptions.length > 0) {
                        const val = args[currentArgIndex];
                        if (!isNaN(parseInt(val))) {
                            const opt = skippedIntOptions.shift();
                            console.log(`[SmartParse] Late-filling option '${opt.name}' with '${val}'`);
                            optionsMap.set(opt.name, val);
                            currentArgIndex++;
                        }
                        else {
                            break;
                        }
                    }
                }
                let replyMessage = null;
                const replyHandler = (payload) => __awaiter(void 0, void 0, void 0, function* () {
                    let finalPayload = payload;
                    if (typeof payload === 'string') {
                        finalPayload = new componentV2_1.V2Embed().setDescription(payload).setColor(0x2f3136).toPayload();
                    }
                    else if (payload instanceof componentV2_1.V2Embed) {
                        finalPayload = payload.toPayload();
                    }
                    else if ((payload === null || payload === void 0 ? void 0 : payload.content) && !(payload === null || payload === void 0 ? void 0 : payload.components) && !(payload === null || payload === void 0 ? void 0 : payload.embeds)) {
                        finalPayload = new componentV2_1.V2Embed().setDescription(payload.content).setColor(0x2f3136).toPayload({
                            ephemeral: payload.ephemeral
                        });
                    }
                    const { ephemeral, fetchReply } = finalPayload, rest = __rest(finalPayload, ["ephemeral", "fetchReply"]);
                    const msgPayload = Object.assign(Object.assign({}, rest), { allowedMentions: { repliedUser: false } });
                    if (replyMessage) {
                        return yield replyMessage.edit(msgPayload);
                    }
                    else {
                        if (!message.channel)
                            return null;
                        try {
                            replyMessage = yield message.reply(Object.assign(Object.assign({}, msgPayload), { failIfNotExists: false }));
                        }
                        catch (e) {
                            replyMessage = yield message.channel.send(msgPayload).catch(() => null);
                        }
                        return replyMessage;
                    }
                });
                const mockInteraction = {
                    client: message.client,
                    user: message.author,
                    member: message.member || (yield ((_t = message.guild) === null || _t === void 0 ? void 0 : _t.members.fetch(message.author.id).catch(() => null))),
                    memberPermissions: (_u = message.member) === null || _u === void 0 ? void 0 : _u.permissions,
                    guild: message.guild,
                    guildId: message.guildId,
                    channel: message.channel,
                    channelId: message.channelId,
                    commandName: commandName,
                    id: message.id,
                    content: message.content,
                    message: message,
                    createdTimestamp: message.createdTimestamp,
                    isChatInputCommand: () => true,
                    isCommand: () => true,
                    isButton: () => false,
                    isModalSubmit: () => false,
                    isStringSelectMenu: () => false,
                    isAnySelectMenu: () => false,
                    options: {
                        getSubcommand: () => subcommandName,
                        getSubcommandGroup: () => groupName,
                        getString: (name) => optionsMap.get(name) || null,
                        getChannel: (name) => {
                            var _a;
                            const id = optionsMap.get(name);
                            if (!id)
                                return null;
                            return ((_a = message.guild) === null || _a === void 0 ? void 0 : _a.channels.cache.get(id)) || null;
                        },
                        getUser: (name) => {
                            const id = optionsMap.get(name);
                            if (!id)
                                return null;
                            return message.client.users.cache.get(id) || null;
                        },
                        getRole: (name) => {
                            var _a, _b, _c;
                            const id = optionsMap.get(name);
                            if (!id)
                                return null;
                            return ((_a = message.guild) === null || _a === void 0 ? void 0 : _a.roles.cache.get(id)) ||
                                ((_b = message.guild) === null || _b === void 0 ? void 0 : _b.roles.cache.find(r => r.name === id)) ||
                                ((_c = message.guild) === null || _c === void 0 ? void 0 : _c.roles.cache.find(r => r.name.toLowerCase() === id.toLowerCase())) || null;
                        },
                        getMember: (name) => {
                            var _a;
                            const id = optionsMap.get(name);
                            if (!id)
                                return null;
                            return ((_a = message.guild) === null || _a === void 0 ? void 0 : _a.members.cache.get(id)) || null;
                        },
                        getInteger: (name) => {
                            const val = optionsMap.get(name);
                            return val ? parseInt(val) : null;
                        },
                        getBoolean: (name) => {
                            const val = optionsMap.get(name);
                            if (!val)
                                return false;
                            const lower = val.toLowerCase();
                            return ['true', 'yes', '1', 'on', 'enable', 'enabled'].includes(lower);
                        },
                        getAttachment: (name) => {
                            return message.attachments.first() || null;
                        }
                    },
                    reply: replyHandler,
                    deferReply: () => __awaiter(void 0, void 0, void 0, function* () { yield message.channel.sendTyping(); }),
                    editReply: replyHandler,
                    deleteReply: () => __awaiter(void 0, void 0, void 0, function* () {
                        if (replyMessage) {
                            yield replyMessage.delete().catch(() => { });
                            replyMessage = null;
                        }
                    }),
                    followUp: (payload) => __awaiter(void 0, void 0, void 0, function* () {
                        let finalPayload = payload;
                        if (typeof payload === 'string') {
                            finalPayload = new componentV2_1.V2Embed().setDescription(payload).setColor(0x2f3136).toPayload();
                        }
                        else if (payload instanceof componentV2_1.V2Embed) {
                            finalPayload = payload.toPayload();
                        }
                        else if ((payload === null || payload === void 0 ? void 0 : payload.content) && !(payload === null || payload === void 0 ? void 0 : payload.components) && !(payload === null || payload === void 0 ? void 0 : payload.embeds)) {
                            finalPayload = new componentV2_1.V2Embed().setDescription(payload.content).setColor(0x2f3136).toPayload({
                                ephemeral: payload.ephemeral
                            });
                        }
                        const { ephemeral, fetchReply } = finalPayload, rest = __rest(finalPayload, ["ephemeral", "fetchReply"]);
                        const msgPayload = Object.assign(Object.assign({}, rest), { allowedMentions: { repliedUser: false } });
                        return yield message.reply(msgPayload);
                    }),
                    isRepliable: () => true,
                    inCachedGuild: () => true
                };
                try {
                    console.log(`[PrefixHandler] Executing run for: ${commandName}`);
                    yield run(mockInteraction, database);
                    console.log(`[PrefixHandler] Execution complete for: ${commandName}`);
                }
                catch (error) {
                    console.error(`[PrefixHandler] Error executing ${commandName}:`, error);
                    let errorMessage = "Unknown error";
                    if (error instanceof Error) {
                        console.error(error.stack);
                        errorMessage = error.message;
                    }
                    yield message.reply(`${config_1.emojis.error} Error executing command: \`${errorMessage}\``);
                }
            }
            catch (err) {
                fs_1.default.appendFileSync('debug.log', `[CRITICAL] Error in Prefix Handler Block: ${err.message}\n`);
                console.error(err);
            }
        }
    }
}));
const help_1 = require("./commands/extra/help");
const dev_1 = require("./commands/owner/dev");
const translate_1 = require("./commands/extra/translate");
client.on("interactionCreate", (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (interaction.isChatInputCommand()) {
        const botConfig = yield database.getBotConfig();
        const isOwner = interaction.user.id === process.env.OWNER_ID;
        if (botConfig.blacklistedUsers.includes(interaction.user.id) && !isOwner) {
            return interaction.reply({ content: `${config_1.emojis.error} **You are blacklisted from using this bot.**`, ephemeral: true });
        }
        if (botConfig.maintenance && !isOwner) {
            return interaction.reply({ content: `${config_1.emojis.warning} **System is currently in Maintenance Mode.**`, ephemeral: true });
        }
        const commandModule = commandHandler.get(interaction.commandName);
        if (!commandModule)
            return;
        try {
            yield commandModule.run(interaction, database);
        }
        catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                yield interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            }
            else {
                yield interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    }
    else if (interaction.isButton() || interaction.isModalSubmit() || interaction.isAnySelectMenu()) {
        if (interaction.customId === 'giveaway_enter') {
            yield GiveawayHandler_1.giveawayHandler.handleEntry(interaction);
        }
        else if (interaction.customId.startsWith('help_')) {
            yield (0, help_1.handleInteraction)(interaction, database);
        }
        else if (interaction.customId.startsWith('dev_')) {
            yield (0, dev_1.handleInteraction)(interaction, database);
        }
        else if (interaction.customId.startsWith('translate_')) {
            yield (0, translate_1.handleInteraction)(interaction, database);
        }
    }
}));
client.on("messageDelete", (message) => {
    (0, SnipeManager_1.handleSnipe)(message);
});
client.login(token).catch(e => {
    console.error("[CRITICAL] Failed to login to Discord:");
    console.error(e);
    if (e.code === 'DisallowedIntents') {
        console.error(">>> SOLUTION: Go to https://discord.com/developers/applications, select your bot, go to 'Bot' tab, and ENABLE all Privileged Gateway Intents (Presence, Server Members, Message Content).");
    }
    else if (e.code === 'TokenInvalid') {
        console.error(">>> SOLUTION: Your Bot Token is invalid. Regenerate it in the Developer Portal and update your hosting environment variables.");
    }
});
