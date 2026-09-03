import { Client, Guild, User, TextChannel, AuditLogEvent, GuildMember, GuildChannel, Role, PermissionsBitField, PartialUser, ChannelType, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import { AntinukeCore } from "./Core";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

export class AntinukeManager {
    private core: AntinukeCore;
    private database: Database;
    private client: Client;

    constructor(client: Client, database: Database) {
        this.client = client;
        this.database = database;
        this.core = new AntinukeCore(database);
        this.registerEvents();
    }

    private registerEvents() {
        this.client.on('channelDelete', (channel) => {
            if ('guild' in channel) this.handleChannelDelete(channel as GuildChannel);
        });

        this.client.on('channelCreate', (channel) => {
            if ('guild' in channel) this.handleChannelCreate(channel as GuildChannel);
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
            this.handleKick(member as GuildMember);
        });

        this.client.on('guildMemberAdd', (member) => {
            this.handleBotAdd(member);
        });

        this.client.on('roleUpdate', (oldRole, newRole) => {
            if (oldRole.guild) this.handleRoleUpdate(oldRole, newRole);
        });

        this.client.on('guildUpdate', (oldGuild, newGuild) => {
            this.handleGuildUpdate(oldGuild, newGuild);
        });

        this.client.on('webhookUpdate', (channel) => {
            if ('guild' in channel) this.handleWebhookUpdate(channel as TextChannel);
        });

        // Anti-Emoji
        this.client.on('emojiCreate', (emoji) => this.handleEmojiUpdate(emoji));
        this.client.on('emojiDelete', (emoji) => this.handleEmojiUpdate(emoji));
        this.client.on('emojiUpdate', (oldEmoji, newEmoji) => this.handleEmojiUpdate(newEmoji));

        // Anti-Sticker
        this.client.on('stickerCreate', (sticker) => this.handleStickerUpdate(sticker));
        this.client.on('stickerDelete', (sticker) => this.handleStickerUpdate(sticker));
        this.client.on('stickerUpdate', (oldSticker, newSticker) => this.handleStickerUpdate(newSticker));

        // Anti-Integration
        this.client.on('guildIntegrationsUpdate', (guild) => this.handleIntegrationUpdate(guild));

        // Anti-Unban
        this.client.on('guildBanRemove', (ban) => this.handleBanRemove(ban));

        // Anti-AutoMod
        this.client.on('autoModerationRuleDelete', (rule) => this.handleAutoModRuleUpdate(rule));
        this.client.on('autoModerationRuleUpdate', (oldRule, newRule) => this.handleAutoModRuleUpdate(newRule));

        // Anti-Thread
        this.client.on('threadDelete', (thread) => this.handleThreadUpdate(thread));
        this.client.on('threadCreate', (thread) => this.handleThreadUpdate(thread));

        // Anti-Member Role Update (Main Role Security)
        this.client.on('guildMemberUpdate', (oldMember, newMember) => this.handleMemberRoleUpdate(oldMember as GuildMember, newMember as GuildMember));

        console.log("Antinuke Manager: Events Registered");
    }


    private async getExecutor(guild: Guild, type: AuditLogEvent): Promise<any> {
        try {
            const logs = await guild.fetchAuditLogs({ limit: 1, type });
            const entry = logs.entries.first();
            if (!entry) return null;
            if (Date.now() - entry.createdTimestamp > 5000) return null;
            return entry.executor;
        } catch {
            return null;
        }
    }

    /* ... helper ... */

    async handleChannelDelete(channel: GuildChannel) {
        if (!channel.guild) return;

        // Auto-Recover Log Channel if deleted
        const guildData = await this.database.retrieveGuild(channel.guild.id);
        if (guildData && guildData.antinuke && guildData.antinuke.enabled && guildData.antinuke.logChannelId === channel.id) {
            try {
                const newChannel = await channel.guild.channels.create({
                    name: 'hertz-log',
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: channel.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: channel.guild.client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
                        }
                    ],
                    reason: 'Antinuke Log Channel Auto-Recovery'
                });

                guildData.antinuke.logChannelId = newChannel.id;
                await this.database.insertGuild(channel.guild.id, guildData);

                const embed = new V2Embed()
                    .setColor(config.colors.primary)
                    .setTitle(`${config.emojis.antinuke} Security Alert`)
                    .setDescription(`${config.emojis.warning} **The previous log channel was deleted.**\n\nI have automatically recreated this channel to ensure **Security Logs** continue without interruption.`)
                    .setThumbnail(channel.guild.iconURL() || this.client.user?.displayAvatarURL() || null)
                    .setFooter('Antinuke Security System', this.client.user?.displayAvatarURL() || undefined);

                await newChannel.send(embed.toPayload());
            } catch (e) {
                console.error("Failed to recover log channel", e);
            }
        }

        const executor = await this.getExecutor(channel.guild, AuditLogEvent.ChannelDelete);
        if (!executor) return;

        const triggered = await this.core.reportAction(channel.guild, executor.id, 'channelDelete');
        if (triggered) {
            // Auto-Recovery: Clone the channel to restore it
            try {
                await channel.clone({
                    name: channel.name, // Keep name
                    reason: "Antinuke Auto-Recovery"
                });
            } catch (e) {
                console.error(`Antinuke: Failed to recover channel ${channel.name}`);
            }
        }
    }

    async handleChannelCreate(channel: GuildChannel) {
        if (!channel.guild) return;
        const executor = await this.getExecutor(channel.guild, AuditLogEvent.ChannelCreate);
        if (!executor) return;

        const triggered = await this.core.reportAction(channel.guild, executor.id, 'channelCreate');
        if (triggered) {
            // Punishment: Delete the created channel
            await channel.delete("Antinuke: Limit Exceeded").catch(() => { });
        }
    }

    async handleRoleDelete(role: Role) {
        const executor = await this.getExecutor(role.guild, AuditLogEvent.RoleDelete);
        if (!executor) return;

        const triggered = await this.core.reportAction(role.guild, executor.id, 'roleDelete');
        if (triggered) {
            // Auto-Recovery: Recreate Role
            try {
                await role.guild.roles.create({
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    permissions: role.permissions,
                    position: role.position,
                    mentionable: role.mentionable,
                    reason: "Antinuke Auto-Recovery"
                });
            } catch (e) {
                console.error(`Antinuke: Failed to recover role ${role.name}`);
            }
        }
    }

    async handleRoleCreate(role: Role) {
        const executor = await this.getExecutor(role.guild, AuditLogEvent.RoleCreate);
        if (!executor) return;

        const triggered = await this.core.reportAction(role.guild, executor.id, 'roleCreate');
        if (triggered) {
            await role.delete("Antinuke: Limit Exceeded").catch(() => { });
        }
    }

    async handleBanAdd(ban: { guild: Guild, user: User }) {
        const executor = await this.getExecutor(ban.guild, AuditLogEvent.MemberBanAdd);
        if (!executor) return;

        const triggered = await this.core.reportAction(ban.guild, executor.id, 'ban');

        if (triggered) {
            await ban.guild.members.unban(ban.user.id, "Antinuke: Unauthorized Ban detected").catch(() => { });
        }
    }

    async handleKick(member: GuildMember) {
        // 1. Check for Prune (Mass Kick)
        try {
            const logs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberPrune });
            const entry = logs.entries.first();
            if (entry && Date.now() - entry.createdTimestamp < 5000) {
                const executor = entry.executor;
                if (executor) {
                    await this.core.reportAction(member.guild, executor.id, 'kick');
                    return;
                }
            }
        } catch { }

        // 2. Normal Kick Check
        const executor = await this.getExecutor(member.guild, AuditLogEvent.MemberKick);
        if (!executor) return; // Must satisfy recent check

        try {
            const logs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
            const entry = logs.entries.first();
            if (!entry) return;

            if (Date.now() - entry.createdTimestamp > 5000) return;
            if (entry.target?.id !== member.id) return; // Not this event

            await this.core.reportAction(member.guild, entry.executor!.id, 'kick');
        } catch { }
    }

    async handleBotAdd(member: GuildMember) {
        if (!member.user.bot) return; // Only care about bots

        const executor = await this.getExecutor(member.guild, AuditLogEvent.BotAdd);
        if (!executor) return;

        const isTrusted = await this.core.isWhitelisted(member.guild, executor.id);
        if (!isTrusted) {
            const guildData = await this.database.retrieveGuild(member.guild.id);
            if (guildData?.antinuke.enabled) {
                await member.kick("Antinuke: Unauthorized Bot Addition").catch(() => { });
                await this.core.punish(member.guild, executor.id, 'kick');
                await member.guild.members.ban(executor.id, { reason: "Antinuke: Added unauthorized bot" }).catch(() => { });
                this.core.log(member.guild, `${config.emojis.antinuke} **Unauthorized Bot Added**\nBot: ${member.user.tag}\nAdder: <@${executor.id}>\n**Action:** Bot Kicked, Adder Banned.`);
            }
        }
    }

    async handleRoleUpdate(oldRole: Role, newRole: Role) {
        if (oldRole.permissions.bitfield === newRole.permissions.bitfield) return; // No perm change

        const dangerous = [PermissionsBitField.Flags.Administrator, PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.KickMembers];
        const addedDangerous = dangerous.filter(p => !oldRole.permissions.has(p) && newRole.permissions.has(p));
        if (addedDangerous.length === 0) return;

        const executor = await this.getExecutor(newRole.guild, AuditLogEvent.RoleUpdate);
        if (!executor) return;

        const isTrusted = await this.core.isWhitelisted(newRole.guild, executor.id);
        if (isTrusted) return;

        const guildData = await this.database.retrieveGuild(newRole.guild.id);
        if (guildData?.antinuke.enabled) {
            await newRole.setPermissions(oldRole.permissions, "Antinuke: Illegal Permission Change");
            await newRole.guild.members.ban(executor.id, { reason: "Antinuke: Illegal Admin Grant" }).catch(() => { });
            this.core.log(newRole.guild, `${config.emojis.antinuke} **Illegal Permission Grant**\nUser <@${executor.id}> tried to give dangerous permissions to role ${newRole.name}.\n**Action:** Reverted & Banned.`);
        }
    }

    async handleWebhookUpdate(channel: TextChannel) {
        if (!channel.guild) return;
        const executor = await this.getExecutor(channel.guild, AuditLogEvent.WebhookCreate);
        // Note: WebhookUpdate event doesn't give specific created/deleted info easily without audit logs.
        // We check WebhookCreate and WebhookDelete.
        // Actually, let's check recent AuditLogs for Webhook Create/Delete/Update.

        let logType = AuditLogEvent.WebhookCreate;
        let actionKey = 'webhookCreate';

        // We try to fetch Create first
        let logs: any = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.WebhookCreate });
        let entry = logs.entries.first();

        if (!entry || Date.now() - entry.createdTimestamp > 5000) {
            // Try Delete
            logs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.WebhookDelete });
            entry = logs.entries.first();
            logType = AuditLogEvent.WebhookDelete;
            actionKey = 'webhookDelete';
        }

        if (!entry || Date.now() - entry.createdTimestamp > 5000) {
            // Try Update
            logs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.WebhookUpdate });
            entry = logs.entries.first();
            logType = AuditLogEvent.WebhookUpdate;
            actionKey = 'webhookUpdate';
        }

        if (!entry || Date.now() - entry.createdTimestamp > 5000) return;

        // Found valid entry
        const executorUser = entry.executor;
        if (!executorUser) return;

        // Reporting 'webhook' as a general category or specific?
        // Let's use 'webhook' for all for now, or just handle it directly.
        // Since limits are defined in Core, we might need to add 'webhook' to limits or treat it as immediate punish like Bot Add.

        // Treat Webhook as High Risk -> Immediate Action (Like Bot Add/Admin)
        const isTrusted = await this.core.isWhitelisted(channel.guild, executorUser.id);
        if (!isTrusted) {
            const guildData = await this.database.retrieveGuild(channel.guild.id);
            if (guildData?.antinuke.enabled) {
                // Punish
                await channel.guild.members.ban(executorUser.id, { reason: "Antinuke: Anti-Webhook Trigger" }).catch(() => { });

                // Try to delete the webhook if created? 
                // Difficult to get the exact webhook object without fetching all.
                // But we banned the user.

                this.core.log(channel.guild, `${config.emojis.antinuke} **Anti-Webhook Triggered**\nUser <@${executorUser.id}> manipulated webhooks.\n**Action:** Banned.`);
            }
        }
    }

    async handleGuildUpdate(oldGuild: Guild, newGuild: Guild) {
        let reason = "";
        let trigger = false;

        // Check Vanity Change
        if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
            reason = "Vanity URL Changed";
            trigger = true;
        }
        // Check Name Change
        else if (oldGuild.name !== newGuild.name) {
            reason = "Server Name Changed";
            trigger = true;
        }
        // Check Icon Change
        else if (oldGuild.icon !== newGuild.icon) {
            reason = "Server Icon Changed";
            trigger = true;
        }
        // Check Widget Enable/Disable
        else if (oldGuild.widgetEnabled !== newGuild.widgetEnabled) {
            reason = "Server Widget Updated";
            trigger = true;
        }
        // Check System Channel
        else if (oldGuild.systemChannelId !== newGuild.systemChannelId) {
            reason = "System Channel Updated";
            trigger = true;
        }
        // Check Rules Channel
        else if (oldGuild.rulesChannelId !== newGuild.rulesChannelId) {
            reason = "Rules Channel Updated";
            trigger = true;
        }
        // Check Updates Channel
        else if (oldGuild.publicUpdatesChannelId !== newGuild.publicUpdatesChannelId) {
            reason = "Community Updates Channel Updated";
            trigger = true;
        }

        if (trigger) {
            const executor = await this.getExecutor(newGuild, AuditLogEvent.GuildUpdate);
            if (!executor) return;

            const isTrusted = await this.core.isWhitelisted(newGuild, executor.id);
            if (isTrusted) return;

            const guildData = await this.database.retrieveGuild(newGuild.id);
            if (guildData?.antinuke.enabled) {
                // Revert changes if possible
                if (reason === "Server Name Changed") {
                    await newGuild.setName(oldGuild.name, "Antinuke Revert").catch(() => { });
                }
                // Icon revert is hard because we need the old icon URL/Buffer. oldGuild.iconURL() works?
                // oldGuild is a snapshot.

                await newGuild.members.ban(executor.id, { reason: `Antinuke: ${reason}` }).catch(() => { });
                this.core.log(newGuild, `${config.emojis.antinuke} **Anti-Guild Update**\nUser <@${executor.id}> triggered: ${reason}.\n**Action:** Banned.`);
            }
        }
    }

    async handleEmojiUpdate(item: any) {
        // Generic handler for Emoji Create/Delete/Update
        const guild = item.guild;
        if (!guild) return;

        // Determine Action Type
        // We'll treat all as "Role Delete" category? No, need new category or classify as 'channelDelete' equivalent?
        // Let's treat Emoji/Sticker griefing as "Role Delete" for now (or low threshold item).
        // Or simply ban if not whitelisted (Strict Mode).

        // Let's fetch logs to find executor
        let executor: User | null = null;

        try {
            let logs: any = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiDelete });
            let entry = logs.entries.first();
            if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;

            if (!executor) {
                logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiCreate });
                entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;
            }
            if (!executor) {
                logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.EmojiUpdate });
                entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;
            }
        } catch { }

        if (!executor) return;

        const isTrusted = await this.core.isWhitelisted(guild, executor.id);
        if (isTrusted) return;

        // Use 'roleDelete' limit as proxy for now, or assume 1/10s.
        // Let's use 'roleDelete' limit.
        const triggered = await this.core.reportAction(guild, executor.id, 'roleDelete'); // Proxying
        if (triggered) {
            this.core.log(guild, `${config.emojis.antinuke} **Anti-Emoji Triggered**\nUser <@${executor.id}> spamming emojis.\n**Action:** ${triggered ? 'Punished' : 'Warned'}.`);
        }
    }

    async handleStickerUpdate(item: any) {
        const guild = item.guild;
        if (!guild) return;

        let executor: User | null = null;
        try {
            let logs: any = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.StickerDelete });
            let entry = logs.entries.first();
            if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;

            if (!executor) {
                logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.StickerCreate });
                entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;
            }
        } catch { }

        if (!executor) return;

        const isTrusted = await this.core.isWhitelisted(guild, executor.id);
        if (isTrusted) return;

        // Proxy with roleDelete
        const triggered = await this.core.reportAction(guild, executor.id, 'roleDelete');
        if (triggered) {
            this.core.log(guild, `${config.emojis.antinuke} **Anti-Sticker Triggered**\nUser <@${executor.id}> spamming stickers.\n**Action:** ${triggered ? 'Punished' : 'Warned'}.`);
        }
    }

    async handleIntegrationUpdate(guild: Guild) {
        let executor: User | null = null;
        let reason = "Integration Modified";

        try {
            // Check Create
            let logs: any = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.IntegrationCreate });
            let entry = logs.entries.first();
            if (entry && Date.now() - entry.createdTimestamp < 5000) {
                executor = entry.executor;
                reason = "Integration Created";
            }

            // Check Delete
            if (!executor) {
                logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.IntegrationDelete });
                entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) {
                    executor = entry.executor;
                    reason = "Integration Deleted";
                }
            }

            // Check Update
            if (!executor) {
                logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.IntegrationUpdate });
                entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) {
                    executor = entry.executor;
                    reason = "Integration Updated";
                }
            }
        } catch { }

        if (!executor) return;

        const isTrusted = await this.core.isWhitelisted(guild, executor.id);
        if (isTrusted) return;

        const guildData = await this.database.retrieveGuild(guild.id);
        if (guildData?.antinuke.enabled) {
            // Ban
            await guild.members.ban(executor.id, { reason: `Antinuke: ${reason}` }).catch(() => { });
            this.core.log(guild, `${config.emojis.antinuke} **Anti-Integration Triggered**\nUser <@${executor.id}> modified integrations.\n**Action:** Banned.`);
        }
    }

    async handleBanRemove(ban: { guild: Guild, user: User }) {
        const executor = await this.getExecutor(ban.guild, AuditLogEvent.MemberBanRemove);
        if (!executor) return;

        // Treat Mass Unban similarly to Mass Ban.
        // Use 'ban' limit.
        const triggered = await this.core.reportAction(ban.guild, executor.id, 'ban');

        if (triggered) {
            // Punish Executor (Already done by reportAction inner logic if configured, but let's ensure logging)
            // Note: reportAction handles punish calls for 'ban' types? 
            // Core checks: if (count > limit) punish().
            // So yes.

            // We might want to RE-BAN the user? 
            // Unban-All is dangerous.
            // We can try to ban the unbanned user back? 
            await ban.guild.members.ban(ban.user.id, { reason: "Antinuke: Auto-Recovery (Unauthorized Unban)" }).catch(() => { });
        }
    }

    async handleAutoModRuleUpdate(rule: any) {
        // Handle Rule Create/Delete/Update
        const guild = rule.guild;
        if (!guild) return;

        let executor: User | null = null;
        let reason = "AutoMod Rule Modified";

        try {
            let logs: any = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.AutoModerationRuleDelete });
            let entry = logs.entries.first();
            if (entry && Date.now() - entry.createdTimestamp < 5000) {
                executor = entry.executor;
                reason = "AutoMod Rule Deleted";
            }

            if (!executor) {
                logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.AutoModerationRuleUpdate });
                entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) {
                    executor = entry.executor;
                    reason = "AutoMod Rule Updated";
                }
            }
        } catch { }

        if (!executor) return;

        const isTrusted = await this.core.isWhitelisted(guild, executor.id);
        if (isTrusted) return;

        const guildData = await this.database.retrieveGuild(guild.id);
        if (guildData?.antinuke.enabled) {
            await guild.members.ban(executor.id, { reason: `Antinuke: ${reason}` }).catch(() => { });
            this.core.log(guild, `${config.emojis.antinuke} **Anti-AutoMod Triggered**\nUser <@${executor.id}> tampered with AutoMod Rules.\n**Action:** Banned.`);
        }
    }

    async handleThreadUpdate(thread: any) {
        // Generic Thread Spam Handler
        // Classify as 'channelDelete' or 'channelCreate' equivalent?
        // Threads are technically channels.
        // Let's use 'channelDelete' limit (usually 3-5).

        const guild = thread.guild;
        if (!guild) return;

        let executor: User | null = null;
        try {
            let logs: any = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ThreadDelete });
            let entry = logs.entries.first();
            if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;

            if (!executor) {
                logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ThreadCreate });
                entry = logs.entries.first();
                if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor;
            }
        } catch { }

        if (!executor) return;

        const isTrusted = await this.core.isWhitelisted(guild, executor.id);
        if (isTrusted) return;

        const triggered = await this.core.reportAction(guild, executor.id, 'channelDelete'); // Proxy
        if (triggered) {
            this.core.log(guild, `${config.emojis.antinuke} **Anti-Thread Triggered**\nUser <@${executor.id}> is spamming threads.\n**Action:** Punished.`);
        }
    }

    async handleMemberRoleUpdate(oldMember: GuildMember, newMember: GuildMember) {
        if (!oldMember.guild) return;
        const guild = newMember.guild;

        // Compare Roles
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        if (oldRoles.size === newRoles.size) return; // Unlikely to be a perm change if size is same, but technically possible via swap. Let's focus on Added Roles (dangerous ones).

        // Find added roles
        const addedRoles = newRoles.filter(r => !oldRoles.has(r.id));
        if (addedRoles.size === 0) return;

        const dangerous = [PermissionsBitField.Flags.Administrator, PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.KickMembers];

        let triggersAntinuke = false;
        let roleName = "";

        for (const [id, role] of addedRoles) {
            if (dangerous.some(p => role.permissions.has(p))) {
                triggersAntinuke = true;
                roleName = role.name;
                break;
            }
        }

        if (!triggersAntinuke) return;

        // Fetch Executor
        const executor = await this.getExecutor(guild, AuditLogEvent.MemberRoleUpdate);
        if (!executor) return;

        const isTrusted = await this.core.isWhitelisted(guild, executor.id);
        if (isTrusted) return;

        const guildData = await this.database.retrieveGuild(guild.id);
        if (guildData?.antinuke.enabled) {
            // Action
            // 1. Remove Roles from Target
            await newMember.roles.set(oldRoles, "Antinuke: Reverting Dangerous Role Grant").catch(() => { });

            // 2. Ban Executor
            await guild.members.ban(executor.id, { reason: "Antinuke: Unauthorized Admin Grant" }).catch(() => { });

            this.core.log(guild, `${config.emojis.antinuke} **Anti-Role Update (Perms)**\nUser <@${executor.id}> gave dangerous role **${roleName}** to <@${newMember.id}>.\n**Action:** Role Reverted & Executor Banned.`);
        }
    }
}
