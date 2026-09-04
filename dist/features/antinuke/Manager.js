"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntinukeManager = void 0;
const discord_js_1 = require("discord.js");
const Core_1 = require("./Core");
const config = __importStar(require("../../config"));
const componentV2_1 = require("../../utilities/componentV2");
class AntinukeManager {
    constructor(client, database) {
        this.client = client;
        this.database = database;
        this.core = new Core_1.AntinukeCore(database);
        this.registerEvents();
    }
    registerEvents() {
        this.client.on('channelDelete', (channel) => {
            if ('guild' in channel)
                this.handleChannelDelete(channel);
        });
        this.client.on('channelCreate', (channel) => {
            if ('guild' in channel)
                this.handleChannelCreate(channel);
        });
        this.client.on('roleDelete', (role) => {
            this.handleRoleDelete(role);
        });
        this.client.on('roleCreate', (role) => {
            this.handleRoleCreate(role);
        });
        this.client.on('guildBanAdd', (ban) => {
            this.handleBanAdd(ban);
        });
        this.client.on('guildMemberRemove', (member) => {
            this.handleKick(member);
        });
        this.client.on('guildMemberAdd', (member) => {
            this.handleBotAdd(member);
        });
        this.client.on('roleUpdate', (oldRole, newRole) => {
            if (oldRole.guild)
                this.handleRoleUpdate(oldRole, newRole);
        });
        this.client.on('guildUpdate', (oldGuild, newGuild) => {
            this.handleGuildUpdate(oldGuild, newGuild);
        });
        this.client.on('webhookUpdate', (channel) => {
            if ('guild' in channel)
                this.handleWebhookUpdate(channel);
        });
        this.client.on('emojiCreate', (emoji) => this.handleEmojiUpdate(emoji));
        this.client.on('emojiDelete', (emoji) => this.handleEmojiUpdate(emoji));
        this.client.on('emojiUpdate', (oldEmoji, newEmoji) => this.handleEmojiUpdate(newEmoji));
        this.client.on('stickerCreate', (sticker) => this.handleStickerUpdate(sticker));
        this.client.on('stickerDelete', (sticker) => this.handleStickerUpdate(sticker));
        this.client.on('stickerUpdate', (oldSticker, newSticker) => this.handleStickerUpdate(newSticker));
        this.client.on('guildIntegrationsUpdate', (guild) => this.handleIntegrationUpdate(guild));
        this.client.on('guildBanRemove', (ban) => this.handleBanRemove(ban));
        this.client.on('autoModerationRuleDelete', (rule) => this.handleAutoModRuleUpdate(rule));
        this.client.on('autoModerationRuleUpdate', (oldRule, newRule) => this.handleAutoModRuleUpdate(newRule));
        this.client.on('threadDelete', (thread) => this.handleThreadUpdate(thread));
        this.client.on('threadCreate', (thread) => this.handleThreadUpdate(thread));
        this.client.on('guildMemberUpdate', (oldMember, newMember) => this.handleMemberRoleUpdate(oldMember, newMember));
        console.log("Antinuke Manager: Events Registered");
    }
    getExecutor(guild, type) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const logs = yield guild.fetchAuditLogs({ limit: 1, type });
                const entry = logs.entries.first();
                if (!entry)
                    return null;
                if (Date.now() - entry.createdTimestamp > 5000)
                    return null;
                return entry.executor;
            }
            catch (_a) {
                return null;
            }
        });
    }
    handleChannelDelete(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!channel.guild)
                return;
            const guildData = yield this.database.retrieveGuild(channel.guild.id);
            if (guildData && guildData.antinuke && guildData.antinuke.enabled && guildData.antinuke.logChannelId === channel.id) {
                try {
                    const newChannel = yield channel.guild.channels.create({
                        name: 'hertz-log',
                        type: discord_js_1.ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: channel.guild.id,
                                deny: [discord_js_1.PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: channel.guild.client.user.id,
                                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.EmbedLinks],
                            }
                        ],
                        reason: 'Antinuke Log Channel Auto-Recovery'
                    });
                    guildData.antinuke.logChannelId = newChannel.id;
                    yield this.database.insertGuild(channel.guild.id, guildData);
                    const embed = new componentV2_1.V2Embed()
                        .setColor(config.colors.default)
                        .setTitle(`${config.emojis.antinuke} Security Alert`)
                        .setDescription(`> ${config.emojis.warning} **The previous log channel was deleted.**\n> Automatically recreated this channel to ensure **Security Logs** continue without interruption.`)
                        .setFooter('Antinuke Security System | Powered by Hertz');
                    yield newChannel.send(embed.toPayload());
                }
                catch (e) {
                    console.error("Failed to recover log channel", e);
                }
            }
            const executor = yield this.getExecutor(channel.guild, discord_js_1.AuditLogEvent.ChannelDelete);
            if (!executor)
                return;
            const triggered = yield this.core.reportAction(channel.guild, executor.id, 'channelDelete');
            if (triggered) {
                try {
                    yield channel.clone({
                        name: channel.name,
                        reason: "Antinuke Auto-Recovery"
                    });
                }
                catch (e) {
                    console.error(`Antinuke: Failed to recover channel ${channel.name}`);
                }
            }
        });
    }
    handleChannelCreate(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!channel.guild)
                return;
            const executor = yield this.getExecutor(channel.guild, discord_js_1.AuditLogEvent.ChannelCreate);
            if (!executor)
                return;
            const triggered = yield this.core.reportAction(channel.guild, executor.id, 'channelCreate');
            if (triggered) {
                yield channel.delete("Antinuke: Limit Exceeded").catch(() => { });
            }
        });
    }
    handleRoleDelete(role) {
        return __awaiter(this, void 0, void 0, function* () {
            const executor = yield this.getExecutor(role.guild, discord_js_1.AuditLogEvent.RoleDelete);
            if (!executor)
                return;
            const triggered = yield this.core.reportAction(role.guild, executor.id, 'roleDelete');
            if (triggered) {
                try {
                    yield role.guild.roles.create({
                        name: role.name,
                        color: role.color,
                        hoist: role.hoist,
                        permissions: role.permissions,
                        position: role.position,
                        mentionable: role.mentionable,
                        reason: "Antinuke Auto-Recovery"
                    });
                }
                catch (e) {
                    console.error(`Antinuke: Failed to recover role ${role.name}`);
                }
            }
        });
    }
    handleRoleCreate(role) {
        return __awaiter(this, void 0, void 0, function* () {
            const executor = yield this.getExecutor(role.guild, discord_js_1.AuditLogEvent.RoleCreate);
            if (!executor)
                return;
            const triggered = yield this.core.reportAction(role.guild, executor.id, 'roleCreate');
            if (triggered) {
                yield role.delete("Antinuke: Limit Exceeded").catch(() => { });
            }
        });
    }
    handleBanAdd(ban) {
        return __awaiter(this, void 0, void 0, function* () {
            const executor = yield this.getExecutor(ban.guild, discord_js_1.AuditLogEvent.MemberBanAdd);
            if (!executor)
                return;
            const triggered = yield this.core.reportAction(ban.guild, executor.id, 'ban');
            if (triggered) {
                yield ban.guild.members.unban(ban.user.id, "Antinuke: Unauthorized Ban detected").catch(() => { });
            }
        });
    }
    handleKick(member) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const logs = yield member.guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.MemberPrune });
                const entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) {
                    const executor = entry.executor;
                    if (executor) {
                        yield this.core.reportAction(member.guild, executor.id, 'kick');
                        return;
                    }
                }
            }
            catch (_b) { }
            const executor = yield this.getExecutor(member.guild, discord_js_1.AuditLogEvent.MemberKick);
            if (!executor)
                return;
            try {
                const logs = yield member.guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.MemberKick });
                const entry = logs.entries.first();
                if (!entry)
                    return;
                if (Date.now() - entry.createdTimestamp > 5000)
                    return;
                if (((_a = entry.target) === null || _a === void 0 ? void 0 : _a.id) !== member.id)
                    return;
                yield this.core.reportAction(member.guild, entry.executor.id, 'kick');
            }
            catch (_c) { }
        });
    }
    handleBotAdd(member) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!member.user.bot)
                return;
            const executor = yield this.getExecutor(member.guild, discord_js_1.AuditLogEvent.BotAdd);
            if (!executor)
                return;
            const isTrusted = yield this.core.isWhitelisted(member.guild, executor.id);
            if (!isTrusted) {
                const guildData = yield this.database.retrieveGuild(member.guild.id);
                if (guildData === null || guildData === void 0 ? void 0 : guildData.antinuke.enabled) {
                    yield member.kick("Antinuke: Unauthorized Bot Addition").catch(() => { });
                    yield this.core.punish(member.guild, executor.id, 'kick');
                    yield member.guild.members.ban(executor.id, { reason: "Antinuke: Added unauthorized bot" }).catch(() => { });
                    this.core.log(member.guild, `${config.emojis.antinuke} **Unauthorized Bot Added**\nBot: ${member.user.tag}\nAdder: <@${executor.id}>\n**Action:** Bot Kicked, Adder Banned.`);
                }
            }
        });
    }
    handleRoleUpdate(oldRole, newRole) {
        return __awaiter(this, void 0, void 0, function* () {
            if (oldRole.permissions.bitfield === newRole.permissions.bitfield)
                return;
            const dangerous = [discord_js_1.PermissionsBitField.Flags.Administrator, discord_js_1.PermissionsBitField.Flags.ManageGuild, discord_js_1.PermissionsBitField.Flags.ManageRoles, discord_js_1.PermissionsBitField.Flags.ManageChannels, discord_js_1.PermissionsBitField.Flags.BanMembers, discord_js_1.PermissionsBitField.Flags.KickMembers];
            const addedDangerous = dangerous.filter(p => !oldRole.permissions.has(p) && newRole.permissions.has(p));
            if (addedDangerous.length === 0)
                return;
            const executor = yield this.getExecutor(newRole.guild, discord_js_1.AuditLogEvent.RoleUpdate);
            if (!executor)
                return;
            const isTrusted = yield this.core.isWhitelisted(newRole.guild, executor.id);
            if (isTrusted)
                return;
            const guildData = yield this.database.retrieveGuild(newRole.guild.id);
            if (guildData === null || guildData === void 0 ? void 0 : guildData.antinuke.enabled) {
                yield newRole.setPermissions(oldRole.permissions, "Antinuke: Illegal Permission Change");
                yield newRole.guild.members.ban(executor.id, { reason: "Antinuke: Illegal Admin Grant" }).catch(() => { });
                this.core.log(newRole.guild, `${config.emojis.antinuke} **Illegal Permission Grant**\nUser <@${executor.id}> tried to give dangerous permissions to role ${newRole.name}.\n**Action:** Reverted & Banned.`);
            }
        });
    }
    handleWebhookUpdate(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!channel.guild)
                return;
            const executor = yield this.getExecutor(channel.guild, discord_js_1.AuditLogEvent.WebhookCreate);
            let logType = discord_js_1.AuditLogEvent.WebhookCreate;
            let actionKey = 'webhookCreate';
            let logs = yield channel.guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.WebhookCreate });
            let entry = logs.entries.first();
            if (!entry || Date.now() - entry.createdTimestamp > 5000) {
                logs = yield channel.guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.WebhookDelete });
                entry = logs.entries.first();
                logType = discord_js_1.AuditLogEvent.WebhookDelete;
                actionKey = 'webhookDelete';
            }
            if (!entry || Date.now() - entry.createdTimestamp > 5000) {
                logs = yield channel.guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.WebhookUpdate });
                entry = logs.entries.first();
                logType = discord_js_1.AuditLogEvent.WebhookUpdate;
                actionKey = 'webhookUpdate';
            }
            if (!entry || Date.now() - entry.createdTimestamp > 5000)
                return;
            const executorUser = entry.executor;
            if (!executorUser)
                return;
            const isTrusted = yield this.core.isWhitelisted(channel.guild, executorUser.id);
            if (!isTrusted) {
                const guildData = yield this.database.retrieveGuild(channel.guild.id);
                if (guildData === null || guildData === void 0 ? void 0 : guildData.antinuke.enabled) {
                    yield channel.guild.members.ban(executorUser.id, { reason: "Antinuke: Anti-Webhook Trigger" }).catch(() => { });
                    this.core.log(channel.guild, `${config.emojis.antinuke} **Anti-Webhook Triggered**\nUser <@${executorUser.id}> manipulated webhooks.\n**Action:** Banned.`);
                }
            }
        });
    }
    handleGuildUpdate(oldGuild, newGuild) {
        return __awaiter(this, void 0, void 0, function* () {
            let reason = "";
            let trigger = false;
            if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
                reason = "Vanity URL Changed";
                trigger = true;
            }
            else if (oldGuild.name !== newGuild.name) {
                reason = "Server Name Changed";
                trigger = true;
            }
            else if (oldGuild.icon !== newGuild.icon) {
                reason = "Server Icon Changed";
                trigger = true;
            }
            else if (oldGuild.widgetEnabled !== newGuild.widgetEnabled) {
                reason = "Server Widget Updated";
                trigger = true;
            }
            else if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
                reason = "System Channel Updated";
                trigger = true;
            }
            else if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) {
                reason = "Rules Channel Updated";
                trigger = true;
            }
            else if (oldGuild.publicUpdatesChannelId !== newGuild.publicUpdatesChannelId) {
                reason = "Community Updates Channel Updated";
                trigger = true;
            }
            if (trigger) {
                const executor = yield this.getExecutor(newGuild, discord_js_1.AuditLogEvent.GuildUpdate);
                if (!executor)
                    return;
                const isTrusted = yield this.core.isWhitelisted(newGuild, executor.id);
                if (isTrusted)
                    return;
                const guildData = yield this.database.retrieveGuild(newGuild.id);
                if (guildData === null || guildData === void 0 ? void 0 : guildData.antinuke.enabled) {
                    if (reason === "Server Name Changed") {
                        yield newGuild.setName(oldGuild.name, "Antinuke Revert").catch(() => { });
                    }
                    yield newGuild.members.ban(executor.id, { reason: `Antinuke: ${reason}` }).catch(() => { });
                    this.core.log(newGuild, `${config.emojis.antinuke} **Anti-Guild Update**\nUser <@${executor.id}> triggered: ${reason}.\n**Action:** Banned.`);
                }
            }
        });
    }
    handleEmojiUpdate(item) {
        return __awaiter(this, void 0, void 0, function* () {
            const guild = item.guild;
            if (!guild)
                return;
            let executor = null;
            try {
                let logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.EmojiDelete });
                let entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000)
                    executor = entry.executor;
                if (!executor) {
                    logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.EmojiCreate });
                    entry = logs.entries.first();
                    if (entry && Date.now() - entry.createdTimestamp < 5000)
                        executor = entry.executor;
                }
                if (!executor) {
                    logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.EmojiUpdate });
                    entry = logs.entries.first();
                    if (entry && Date.now() - entry.createdTimestamp < 5000)
                        executor = entry.executor;
                }
            }
            catch (_a) { }
            if (!executor)
                return;
            const isTrusted = yield this.core.isWhitelisted(guild, executor.id);
            if (isTrusted)
                return;
            const triggered = yield this.core.reportAction(guild, executor.id, 'roleDelete');
            if (triggered) {
                this.core.log(guild, `${config.emojis.antinuke} **Anti-Emoji Triggered**\nUser <@${executor.id}> spamming emojis.\n**Action:** ${triggered ? 'Punished' : 'Warned'}.`);
            }
        });
    }
    handleStickerUpdate(item) {
        return __awaiter(this, void 0, void 0, function* () {
            const guild = item.guild;
            if (!guild)
                return;
            let executor = null;
            try {
                let logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.StickerDelete });
                let entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000)
                    executor = entry.executor;
                if (!executor) {
                    logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.StickerCreate });
                    entry = logs.entries.first();
                    if (entry && Date.now() - entry.createdTimestamp < 5000)
                        executor = entry.executor;
                }
            }
            catch (_a) { }
            if (!executor)
                return;
            const isTrusted = yield this.core.isWhitelisted(guild, executor.id);
            if (isTrusted)
                return;
            const triggered = yield this.core.reportAction(guild, executor.id, 'roleDelete');
            if (triggered) {
                this.core.log(guild, `${config.emojis.antinuke} **Anti-Sticker Triggered**\nUser <@${executor.id}> spamming stickers.\n**Action:** ${triggered ? 'Punished' : 'Warned'}.`);
            }
        });
    }
    handleIntegrationUpdate(guild) {
        return __awaiter(this, void 0, void 0, function* () {
            let executor = null;
            let reason = "Integration Modified";
            try {
                let logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.IntegrationCreate });
                let entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) {
                    executor = entry.executor;
                    reason = "Integration Created";
                }
                if (!executor) {
                    logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.IntegrationDelete });
                    entry = logs.entries.first();
                    if (entry && Date.now() - entry.createdTimestamp < 5000) {
                        executor = entry.executor;
                        reason = "Integration Deleted";
                    }
                }
                if (!executor) {
                    logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.IntegrationUpdate });
                    entry = logs.entries.first();
                    if (entry && Date.now() - entry.createdTimestamp < 5000) {
                        executor = entry.executor;
                        reason = "Integration Updated";
                    }
                }
            }
            catch (_a) { }
            if (!executor)
                return;
            const isTrusted = yield this.core.isWhitelisted(guild, executor.id);
            if (isTrusted)
                return;
            const guildData = yield this.database.retrieveGuild(guild.id);
            if (guildData === null || guildData === void 0 ? void 0 : guildData.antinuke.enabled) {
                yield guild.members.ban(executor.id, { reason: `Antinuke: ${reason}` }).catch(() => { });
                this.core.log(guild, `${config.emojis.antinuke} **Anti-Integration Triggered**\nUser <@${executor.id}> modified integrations.\n**Action:** Banned.`);
            }
        });
    }
    handleBanRemove(ban) {
        return __awaiter(this, void 0, void 0, function* () {
            const executor = yield this.getExecutor(ban.guild, discord_js_1.AuditLogEvent.MemberBanRemove);
            if (!executor)
                return;
            const triggered = yield this.core.reportAction(ban.guild, executor.id, 'ban');
            if (triggered) {
                yield ban.guild.members.ban(ban.user.id, { reason: "Antinuke: Auto-Recovery (Unauthorized Unban)" }).catch(() => { });
            }
        });
    }
    handleAutoModRuleUpdate(rule) {
        return __awaiter(this, void 0, void 0, function* () {
            const guild = rule.guild;
            if (!guild)
                return;
            let executor = null;
            let reason = "AutoMod Rule Modified";
            try {
                let logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.AutoModerationRuleDelete });
                let entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) {
                    executor = entry.executor;
                    reason = "AutoMod Rule Deleted";
                }
                if (!executor) {
                    logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.AutoModerationRuleUpdate });
                    entry = logs.entries.first();
                    if (entry && Date.now() - entry.createdTimestamp < 5000) {
                        executor = entry.executor;
                        reason = "AutoMod Rule Updated";
                    }
                }
            }
            catch (_a) { }
            if (!executor)
                return;
            const isTrusted = yield this.core.isWhitelisted(guild, executor.id);
            if (isTrusted)
                return;
            const guildData = yield this.database.retrieveGuild(guild.id);
            if (guildData === null || guildData === void 0 ? void 0 : guildData.antinuke.enabled) {
                yield guild.members.ban(executor.id, { reason: `Antinuke: ${reason}` }).catch(() => { });
                this.core.log(guild, `${config.emojis.antinuke} **Anti-AutoMod Triggered**\nUser <@${executor.id}> tampered with AutoMod Rules.\n**Action:** Banned.`);
            }
        });
    }
    handleThreadUpdate(thread) {
        return __awaiter(this, void 0, void 0, function* () {
            const guild = thread.guild;
            if (!guild)
                return;
            let executor = null;
            try {
                let logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.ThreadDelete });
                let entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000)
                    executor = entry.executor;
                if (!executor) {
                    logs = yield guild.fetchAuditLogs({ limit: 1, type: discord_js_1.AuditLogEvent.ThreadCreate });
                    entry = logs.entries.first();
                    if (entry && Date.now() - entry.createdTimestamp < 5000)
                        executor = entry.executor;
                }
            }
            catch (_a) { }
            if (!executor)
                return;
            const isTrusted = yield this.core.isWhitelisted(guild, executor.id);
            if (isTrusted)
                return;
            const triggered = yield this.core.reportAction(guild, executor.id, 'channelDelete');
            if (triggered) {
                this.core.log(guild, `${config.emojis.antinuke} **Anti-Thread Triggered**\nUser <@${executor.id}> is spamming threads.\n**Action:** Punished.`);
            }
        });
    }
    handleMemberRoleUpdate(oldMember, newMember) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!oldMember.guild)
                return;
            const guild = newMember.guild;
            const oldRoles = oldMember.roles.cache;
            const newRoles = newMember.roles.cache;
            if (oldRoles.size === newRoles.size)
                return;
            const addedRoles = newRoles.filter(r => !oldRoles.has(r.id));
            if (addedRoles.size === 0)
                return;
            const dangerous = [discord_js_1.PermissionsBitField.Flags.Administrator, discord_js_1.PermissionsBitField.Flags.ManageGuild, discord_js_1.PermissionsBitField.Flags.ManageRoles, discord_js_1.PermissionsBitField.Flags.ManageChannels, discord_js_1.PermissionsBitField.Flags.BanMembers, discord_js_1.PermissionsBitField.Flags.KickMembers];
            let triggersAntinuke = false;
            let roleName = "";
            for (const [id, role] of addedRoles) {
                if (dangerous.some(p => role.permissions.has(p))) {
                    triggersAntinuke = true;
                    roleName = role.name;
                    break;
                }
            }
            if (!triggersAntinuke)
                return;
            const executor = yield this.getExecutor(guild, discord_js_1.AuditLogEvent.MemberRoleUpdate);
            if (!executor)
                return;
            const isTrusted = yield this.core.isWhitelisted(guild, executor.id);
            if (isTrusted)
                return;
            const guildData = yield this.database.retrieveGuild(guild.id);
            if (guildData === null || guildData === void 0 ? void 0 : guildData.antinuke.enabled) {
                yield newMember.roles.set(oldRoles, "Antinuke: Reverting Dangerous Role Grant").catch(() => { });
                yield guild.members.ban(executor.id, { reason: "Antinuke: Unauthorized Admin Grant" }).catch(() => { });
                this.core.log(guild, `${config.emojis.antinuke} **Anti-Role Update (Perms)**\nUser <@${executor.id}> gave dangerous role **${roleName}** to <@${newMember.id}>.\n**Action:** Role Reverted & Executor Banned.`);
            }
        });
    }
}
exports.AntinukeManager = AntinukeManager;
