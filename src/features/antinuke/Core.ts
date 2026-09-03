
import { Client, Guild, User, TextChannel, PermissionFlagsBits, AuditLogEvent } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

interface ActionTracker {
    count: number;
    lastTime: number;
    timer: NodeJS.Timeout | null;
}

export class AntinukeCore {
    // Cache: guildId_userId_actionType -> Tracker
    private rateLimits: Map<string, ActionTracker> = new Map();
    private database: Database;

    constructor(database: Database) {
        this.database = database;
    }

    /**
     * Checks if a user is whitelisted (Immune).
     * Uses the Master Whitelist (links/invites/spam combined for now, or unified list).
     * Actually, we should check ALL whitelist categories to be safe, or just spam?
     * PROPOSAL: Check against ALL whitelist arrays. If in ANY, they are trusted.
     */
    async isWhitelisted(guild: Guild, userId: string): Promise<boolean> {
        const guildData = await this.database.retrieveGuild(guild.id);
        if (!guildData) return false;

        // 1. Owner & Self Check (Absolute Immunity)
        if (guild.ownerId === userId) return true;
        if (userId === guild.client.user.id) return true;

        // 2. Extra Owners Check
        if (guildData.extraOwners && guildData.extraOwners.includes(userId)) return true;

        // 3. Extra Admins Check
        if (guildData.extraAdmins && guildData.extraAdmins.includes(userId)) return true;

        if (!guildData.messageFilters) return false;

        const lists = [
            guildData.messageFilters.linksWhitelist,
            guildData.messageFilters.invitesWhitelist,
            guildData.messageFilters.spamWhitelist
        ];

        // 4. Message Filter Whitelists (User ID)
        for (const list of lists) {
            if (list?.users.includes(userId)) return true;
        }

        // 5. Check Roles (Requires Member Fetch)
        try {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) return false;

            for (const list of lists) {
                if (list?.roles && list.roles.some(roleId => member.roles.cache.has(roleId))) {
                    return true;
                }
            }
        } catch (e) {
            // Ignore fetch errors
        }

        return false;
    }

    /**
     * Report an action to the Antinuke system.
     * @returns true if action limit exceeded (Triggered), false otherwise.
     */
    async reportAction(guild: Guild, executorId: string, actionType: 'channelDelete' | 'channelCreate' | 'roleDelete' | 'roleCreate' | 'ban' | 'kick'): Promise<boolean> {
        const guildData = await this.database.retrieveGuild(guild.id);
        if (!guildData || !guildData.antinuke || !guildData.antinuke.enabled) return false;

        // 1. Whitelist Check
        if (await this.isWhitelisted(guild, executorId)) return false;

        // 2. Rate Limit Check
        const key = `${guild.id}_${executorId}_${actionType}`;
        const limit = guildData.antinuke.limits[actionType];
        const timeWindow = 10000; // 10 Seconds Window

        let tracker = this.rateLimits.get(key);

        if (!tracker) {
            tracker = {
                count: 1,
                lastTime: Date.now(),
                timer: setTimeout(() => this.rateLimits.delete(key), timeWindow)
            };
            this.rateLimits.set(key, tracker);
        } else {
            tracker.count++;

            // Optimization: Reset timer on new activity? No, strictly time window.
            // Actually, sliding window is complex. Fixed window from first action is easier.
        }

        if (tracker.count >= limit) {
            // TRIGGERED
            // Clear tracker so we don't spam ban attempts if they keep going fast
            this.rateLimits.delete(key);
            // Actually, keep it deleted so we act immediately. 
            // If we leave it, the next action triggers again. 
            // Proper logic: Trigger ONCE per threshold crossing.

            await this.punish(guild, executorId, actionType);
            return true;
        }

        return false;
    }

    /**
     * Punish the user based on configuration.
     */
    async punish(guild: Guild, executorId: string, actionType: string) {
        const guildData = await this.database.retrieveGuild(guild.id);
        if (!guildData) return;

        const action = guildData.antinuke.actions[actionType as keyof typeof guildData.antinuke.actions] || 'ban';

        try {
            const member = await guild.members.fetch(executorId).catch(() => null);
            if (!member) {
                // If member left, try to ban by ID if action is ban
                if (action === 'ban') {
                    await guild.members.ban(executorId, { reason: `[Antinuke] Exceeded limit for ${actionType}` });
                }
                return;
            }

            if (!member.bannable && !member.kickable) {
                // Cannot punish? Try to strip roles (Quarantine)
                // This requires iterating roles and removing dangerous ones.
                // For now, let's log failure.
                this.log(guild, `**FAILED to punish** <@${executorId}> for ${actionType}. My permissions might be lower.`);
                return;
            }

            if (action === 'ban') {
                await member.ban({ reason: `[Antinuke] Rate limit exceeded for ${actionType}` });
                this.log(guild, `**BANNED** <@${executorId}> for exceeding limit in **${actionType}**.`);
            } else if (action === 'kick') {
                await member.kick(`[Antinuke] Rate limit exceeded for ${actionType}`);
                this.log(guild, `**KICKED** <@${executorId}> for exceeding limit in **${actionType}**.`);
            } else {
                // Warn (Do nothing or DM)
            }

        } catch (e) {
            console.error(`Status: Failed to punish ${executorId}`, e);
        }
    }

    async log(guild: Guild, message: string) {
        const guildData = await this.database.retrieveGuild(guild.id);
        if (guildData?.antinuke.logChannelId) {
            const channel = guild.channels.cache.get(guildData.antinuke.logChannelId) as TextChannel;
            if (channel && channel.isTextBased()) {
                const embed = new V2Embed()
                    .setColor(config.colors.error)
                    .setTitle(`${config.emojis.error} Antinuke Triggered`)
                    .setDescription(message)
                    .setTimestamp();
                await channel.send(embed.toPayload()).catch(() => { });
            }
        }
    }

    // Helper to get guild from client if needed, but we pass guild obj usually
}
