import { Guild as DiscordGuild } from "discord.js";
import Keyv from "keyv";
import * as fs from 'fs';

/* Stores all the data that needs to be cached when anti-raid mode is turned on */
export interface RaidCache {
    bannedUsers: string[],
}

export interface SpamFilter { }

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
    customEmbeds: { [name: string]: any }, // Stores JSON embed objects

    // Legacy whitelist (Deprecated) - Keeping for potential compilation errors until fully migrated
    whitelist?: {
        users: string[],
        roles: string[],
        channels: string[]
    },

    noPrefixUsers: string[]; // Server-scoped No Prefix Users
    autoroles: string[];
    autorolesBots: string[];
}

/* Global Bot Configuration */
export interface BotConfig {
    maintenance: boolean;
    blacklistedUsers: string[];
    blacklistedGuilds: string[];
    premiumUsers: string[];
    premiumGuilds: string[];
}


import KeyvMongo from '@keyv/mongo';

export class Database {
    inner: Keyv<Guild>

    constructor() {
        const mongoUrl = process.env.MONGO_URL?.trim();
        if (mongoUrl) {
            try {
                // Append SSL bypass option to existing URL
                console.log("DEBUG: Connecting to MongoDB...");
                // @ts-ignore
                // @ts-ignore
                const store = new KeyvMongo(mongoUrl, { dbName: 'xeon', tls: true });
                this.inner = new Keyv({ store: store as any });

                // monitor connection errors if possible
                this.inner.on('error', (err: any) => {
                    console.warn('[Database Warning] MongoDB connection issue. Switching to in-memory storage temporarily.');
                    console.error('Connection Error Detail:', err.message);
                    this.inner = new Keyv();
                });

            } catch (error) {
                console.warn("[Database Warning] Failed to connect to MongoDB. Using in-memory storage.");
                this.inner = new Keyv();
            }
        } else {
            console.warn('MONGO_URL not found in .env, falling back to in-memory storage (data will be lost on restart)');
            this.inner = new Keyv();
        }
    }

    async defaultGuild(guild: DiscordGuild) {
        const webhooksWhiteList: string[] = [];

        /* All webhooks when the bot is added to the guild are whitelisted */
        try {
            const webhooks = await guild.fetchWebhooks();
            for (const webhook of webhooks) {
                webhooksWhiteList.push(webhook[1].id);
            }
        } catch (e) {
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
                    author: {
                        name: "Welcome {user.name}!",
                        icon: "{user.avatar}"
                    },
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
                    channelDelete: 3,
                    channelCreate: 5,
                    roleDelete: 3,
                    roleCreate: 5,
                    ban: 3,
                    kick: 3,
                },
                actions: {
                    channelDelete: 'ban',
                    channelCreate: 'ban',
                    roleDelete: 'ban',
                    roleCreate: 'ban',
                    ban: 'ban',
                    kick: 'ban',
                }
            },

            reactionRoles: {},
            colorRoles: true,

            raidCache: {
                bannedUsers: []
            },
            banCache: [],
            eventRateCache: new Map(),

            tempBans: [],
            // Main whitelist removed in favor of module-specific
            whitelist: { users: [], roles: [], channels: [] },

            customEmbeds: {},
            noPrefixUsers: [],
            autoroles: [],
            autorolesBots: []
        });
    }

    async insertGuild(id: string, guild: Guild) {
        await this.inner.set(id, guild);
    }

    async retrieveGuild(id: string): Promise<Guild | undefined> {
        // console.log(`[Database] Retrieving guild ${id}...`);
        try {
            const result = await Promise.race([
                this.inner.get(id),
                new Promise<undefined>((_, reject) => setTimeout(() => reject(new Error('DB_TIMEOUT')), 10000))
            ]);
            return result;
        } catch (e: any) {
            console.error(`[Database] Retrieve failed for ${id}: ${e.message}`);
            if (e.message === 'DB_TIMEOUT') {
                console.warn("[Database] MongoDB is unresponsive. Switched to In-Memory Storage to keep bot running. Check your IP Whitelist (0.0.0.0/0) in Atlas.");
                this.inner = new Keyv();
            }
            return undefined;
        }
    }

    async removeGuild(id: string) {
        await this.inner.delete(id);
    }

    /* Global Config Methods */
    async getBotConfig(): Promise<BotConfig> {
        try {
            let config = await this.inner.get('bot_config') as BotConfig | undefined;
            if (!config) {
                config = {
                    maintenance: false,
                    blacklistedUsers: [],
                    blacklistedGuilds: [],
                    premiumUsers: [],
                    premiumGuilds: []
                };
                await this.insertBotConfig(config);
            }
            return config;
        } catch (e) {
            console.error(`[Database] Failed to retrieve bot config:`, e);
            return {
                maintenance: false,
                blacklistedUsers: [],
                blacklistedGuilds: [],
                premiumUsers: [],
                premiumGuilds: []
            };
        }
    }

    async insertBotConfig(config: BotConfig) {
        await this.inner.set('bot_config', config as any);
    }
}