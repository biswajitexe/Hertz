
console.log(`[DEBUG] Starting bot process... PID: ${process.pid} | Instance: ${Math.floor(Math.random() * 10000)}`);
import express from 'express';
const app = express();
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
import { log } from "./logging";
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

/* Global Error Handling to catch silent crashes */
process.on('unhandledRejection', (reason, p) => {
    console.error('[Anti-Crash] Unhandled Rejection/Catch');
    console.error(reason, p);
});

process.on('uncaughtException', (err, origin) => {
    console.error('[Anti-Crash] Uncaught Exception/Catch');
    console.error(err, origin);
});

// Token Validation
const token = (process.env.DISCORD_TOKEN as string)?.trim();
if (!token) {
    console.error("❌ CRITICAL ERROR: DISCORD_TOKEN is missing from Environment Variables!");
    console.error(">>> Please add 'DISCORD_TOKEN' to your hosting environment settings.");
    process.exit(1);
}

import { Client, Collection, GatewayIntentBits, Partials, ActivityType, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { Database } from "./database";
import { giveawayHandler } from "./structures/GiveawayHandler";
import { handleSnipe } from "./structures/SnipeManager";
import { isBadMessage, replaceValues } from "./utilities/messages";
import { emojis, prefix, colors } from "./config";
import { V2Embed } from "./utilities/componentV2";

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel]
});

/* Initiailize database and command handler */
const database = new Database();
const commandHandler: Collection<string, any> = new Collection();

/* Anti-Spam Cache */
const spamCache = new Map<string, { score: number, lastMessage: string, lastTimestamp: number }>();

/* Regular expression to match URLs */
const linksRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

/* Helper function to recursively scan all the files and sub-directories and register the commands */
function registerCommands(dir: string) {
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of commandFiles) {
        const data = require(path.join(dir, file));
        // console.log(`[DEBUG] Registering command: ${data.command.name}`); // Cleaned up
        commandHandler.set(data.command.name, data);
        if (data.aliases && Array.isArray(data.aliases)) {
            for (const alias of data.aliases) {
                commandHandler.set(alias, data);
            }
        }
    }

    const commandFolders = fs.readdirSync(dir)
        .filter(file => fs.lstatSync(path.join(dir, file)).isDirectory());

    for (const commandFolder of commandFolders) {
        registerCommands(path.join(dir, commandFolder));
    }
}

client.once("ready", async (client) => {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    const commandsPath = path.resolve(__dirname, "commands");
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

    /* Register all commands from the `commands` folder */
    registerCommands(path.join(__dirname, "commands"));

    /* Add all guilds to the database */
    for (const guild of client.guilds.cache.values()) {
        await database.defaultGuild(guild);
    }
    
    // console.log("[DEBUG] All Registered Commands:", Array.from(commandHandler.keys()));

    /* Temp Ban Scheduler */
    setInterval(async () => {
        for (const guild of client.guilds.cache.values()) {
            const data = await database.retrieveGuild(guild.id);
            if (!data || !data.tempBans || data.tempBans.length === 0) continue;

            const now = Date.now();
            const expiredBans = data.tempBans.filter(ban => ban.endTime <= now);

            if (expiredBans.length > 0) {
                // Remove expired bans from DB locally first to prevent double processing if slow
                data.tempBans = data.tempBans.filter(ban => ban.endTime > now);
                await database.insertGuild(guild.id, data);

                for (const ban of expiredBans) {
                    try {
                        await guild.members.unban(ban.userId, `Temp ban expired. (Original reason: ${ban.reason})`);
                        // Optional: Log unban
                    } catch (e) {
                        console.error(`Failed to unban user ${ban.userId} in guild ${guild.id}:`, e);
                    }
                }
            }
        }
    }, 60 * 1000); // Check every minute

    log(`b{ Logged in as ${client.user.username}.}`);
    console.log("[DEBUG] Active Intents:", client.options.intents);
    console.log("[DEBUG] Welcomer Commands Loaded:", JSON.stringify(require('./config').modules.welcomer.commands.map((c: any) => c.name), null, 2));
    giveawayHandler.init(client);

    /* Initialize Antinuke */
    const { AntinukeManager } = require("./features/antinuke/Manager");
    new AntinukeManager(client, database);
    /* Set Status and Activity */
    client.user.setPresence({
        status: 'dnd',
        activities: [{
            name: 'Server Security | ?help',
            type: ActivityType.Watching
        }]
    });
});

// Webhook listener removed for 'normal' behavior (No auto-deletion)



client.on("guildMemberAdd", async (member) => {
    let guild = await database.retrieveGuild(member.guild.id);
    if (!guild) return;

    /* Security checks (Anti-Raid / Ban Evasion) removed for normal behavior */

    /* Security checks (Anti-Raid / Ban Evasion) removed for normal behavior */

    /* Autorole System */
    const rolesToAdd = member.user.bot ? (guild.autorolesBots || []) : (guild.autoroles || []);

    if (rolesToAdd.length > 0) {
        try {
            // Filter valid roles that still exist in the guild
            const validRoles = rolesToAdd.filter(roleId => member.guild.roles.cache.has(roleId));

            // Assign roles
            if (validRoles.length > 0) {
                await member.roles.add(validRoles, "Autorole on Join").catch(e =>
                    console.error(`[Autorole] Failed to add roles to ${member.user.tag} in ${member.guild.name}:`, e)
                );
            }
        } catch (e) {
            console.error(`[Autorole] Error in guild ${member.guild.id}:`, e);
        }
    }

    /* Welcome System */
    if (guild.welcome && guild.welcome.enabled && guild.welcome.channelId) {
        const channel = member.guild.channels.cache.get(guild.welcome.channelId);

        if (channel && channel.isTextBased()) {
            const conf = guild.welcome;

            // Helper parsing function (Duplicate of parsing logic to avoid circular dependency, or move to utils)
            // For simplicity, implementing inline since it's short
            const parse = (str: string) => {
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

            const embed = new V2Embed();
            let hasEmbed = false;

            if (conf.embed.author?.name) {
                embed.setAuthor(
                    parse(conf.embed.author.name),
                    conf.embed.author.icon ? parse(conf.embed.author.icon) : undefined
                );
                hasEmbed = true;
            }
            if (conf.embed.title) { embed.setTitle(parse(conf.embed.title)); hasEmbed = true; }
            if (conf.embed.description) { embed.setDescription(parse(conf.embed.description)); hasEmbed = true; }
            if (conf.embed.color) { embed.setColor(conf.embed.color); hasEmbed = true; }
            if (conf.embed.image) { embed.setImage(parse(conf.embed.image)); hasEmbed = true; }

            let thumb = conf.embed.thumbnail;
            if (thumb === '{user.avatar}') thumb = member.user.displayAvatarURL();
            else if (thumb) thumb = parse(thumb);
            if (thumb) { embed.setThumbnail(thumb); hasEmbed = true; }

            if (conf.embed.footer) { embed.setFooter(parse(conf.embed.footer)); hasEmbed = true; }
            if (conf.embed.timestamp) { embed.setTimestamp(); hasEmbed = true; }

            if (hasEmbed) {
                if (conf.content) {
                    embed.setDescription(`${parse(conf.content)}\n\n${conf.embed.description ? parse(conf.embed.description) : ""}`.trim());
                }
                await channel.send(embed.toPayload()).catch(console.error);
            } else if (conf.content) {
                const textEmbed = new V2Embed().setDescription(parse(conf.content));
                await channel.send(textEmbed.toPayload()).catch(console.error);
            }
        }
    }
});

client.on("guildBanAdd", async (ban) => {
    let guild = await database.retrieveGuild(ban.guild.id);
    if (!guild) return;

    /* If member was not banned due to antiraid mode, add them to the server ban cache */
    if (!guild.raidCache.bannedUsers.includes(ban.user.id)) {
        guild.banCache.push(ban.user.id);
        database.insertGuild(ban.guild.id, guild);
    }
});

client.on("channelCreate", async (channel) => {
    if (channel.isDMBased()) return;
    let guild = await database.retrieveGuild(channel.guild.id);
    if (!guild) return;

    if (guild.antiRaid) await channel.delete("[AutoMod] Anti-raid was enabled.");
});

client.on("roleCreate", async (role) => {
    let guild = await database.retrieveGuild(role.guild.id);
    if (!guild) return;

    if (guild.antiRaid) await role.delete("[AutoMod] Anti-raid was enabled.");
});

client.on("guildCreate", async (guild) => await database.defaultGuild(guild));
client.on("guildDelete", async (guild) => await database.removeGuild(guild.id as string));

client.on("messageCreate", async message => {
    if (message.author.bot || !message.guild) return;

    try {
        fs.appendFileSync('debug.log', `[DEBUG] [PID:${process.pid}] Processing: '${message.content}' | Prefix loaded: '${prefix}'\n`);
    } catch (e) { }

    console.log(`[DEBUG] User Message: '${message.content}' | Command 'antilink' loaded: ${commandHandler.has('antilink')}`);

    /* Mention Reply */
    if (message.content === `<@${client.user!.id}>` || message.content === `<@!${client.user!.id}>`) {
        const guildData = await database.retrieveGuild(message.guild.id);
        const currentPrefix = guildData?.prefix || prefix;

        const embed = new V2Embed()
            .setColor(0x5865F2)
            .setAuthor("Hertz Security", client.user!.displayAvatarURL())
            .setTitle("Hey there! I'm Hertz.")
            .setDescription(`**I am a powerful security and moderation bot designed to protect your server.**\n\nType \`${currentPrefix}help\` to see my commands!`)
            .setFooter("Protected by Hertz Security System", message.guild.iconURL() || undefined)
            .setTimestamp();

        const inviteBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Invite Me")
            .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user!.id}&permissions=8&scope=bot%20applications.commands`);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(inviteBtn);

        await message.reply(embed.toPayload({ extraComponents: [row] }));
        return;
    }

    // AFK Check
    const guildData = await database.retrieveGuild(message.guild.id);
    if (guildData) {
        // 1. Check if author is AFK (Remove AFK)
        if (guildData.afk[message.author.id]) {
            const afkData = guildData.afk[message.author.id];
            delete guildData.afk[message.author.id];
            await database.insertGuild(message.guild.id, guildData);

            // Calculate Duration
            const diff = Date.now() - afkData.timestamp;
            const minutes = Math.floor((diff / 1000) / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            let duration = "";
            if (days > 0) duration = `${days} days, ${hours % 24} hrs`;
            else if (hours > 0) duration = `${hours} hrs, ${minutes % 60} min`;
            else if (minutes > 0) duration = `${minutes} min, ${Math.floor((diff / 1000) % 60)} sec`;
            else duration = "a few seconds";

            const afkEmbed = new V2Embed()
                .setColor(colors.default)
                .setDescription(`> ${emojis.human} **Welcome back, ${message.author.username}!**\n> AFK removed. \`${duration}\``);

            await message.reply(afkEmbed.toPayload())
                .then(m => setTimeout(() => m.delete().catch(() => { }), 30000));
        }

        // 2. Check if mentioned user is AFK
        if (message.mentions.members && message.mentions.members.size > 0) {
            const afkMembers: string[] = [];
            message.mentions.members.forEach(m => {
                if (guildData.afk[m.id]) {
                    const data = guildData.afk[m.id];
                    const time = Math.floor(data.timestamp / 1000);
                    afkMembers.push(`> ${emojis.info} ${m.user.username} is AFK: **${data.reason}** (<t:${time}:R>)`);
                }
            });

            if (afkMembers.length > 0) {
                const embed = new V2Embed()
                    .setColor(colors.default)
                    .setDescription(afkMembers.join("\n"));

                await message.reply(embed.toPayload());
            }
        }
    }

        // No separate retrieval here, use existing guildData
        let guild = guildData;

        if (!guild) {
            // Auto-create guild data if missing (Crucial for In-Memory Storage)
            try {
                await database.defaultGuild(message.guild);
                guild = await database.retrieveGuild(message.guildId!);
            } catch (e: any) {
                console.error(`[Database] Failed to create default guild: ${e.message}`);
            }

            if (!guild) return; 
        }

    /* --- ANTI-INVITE SYSTEM --- */
    if (guild?.messageFilters.discordInvites) {
        const inviteRegex = /(discord.gg\/|discord.com\/invite\/|discordapp.com\/invite\/)/i;
        if (message.content.search(inviteRegex) >= 0) {
            // Check Whitelist
            let isWhitelisted = false;
            if (guild.messageFilters.invitesWhitelist) {
                const wl = guild.messageFilters.invitesWhitelist;
                const isWhitelistedUser = wl.users.includes(message.author.id);
                const isWhitelistedRole = message.member?.roles.cache.some(r => wl.roles.includes(r.id));
                const isWhitelistedChannel = wl.channels.includes(message.channel.id);
                const isAdmin = message.member?.permissions.has("Administrator");
                if (isWhitelistedUser || isWhitelistedRole || isWhitelistedChannel || isAdmin) isWhitelisted = true;
            }

            if (!isWhitelisted) {
                await message.delete().catch(() => { });
                const msg = await message.channel.send(`${emojis.links} <@${message.author.id}> **Discord Invites are not allowed in this server!**`);
                setTimeout(() => msg.delete().catch(() => { }), 5000);
                return; // Stop processing further
            }
        }
    }

    /* --- ANTI-LINK SYSTEM --- */
    if (guild?.messageFilters.links) {
        if (message.content.search(linksRegex) >= 0) {
            // Check Whitelist
            let isWhitelisted = false;

            // Smart Whitelist (Internal & Media)
            const internalLink = message.guild.id;
            const trustedDomains = [
                "youtube.com", "youtu.be",
                "spotify.com", "open.spotify.com",
                "tenor.com", "giphy.com",
                "discord.com/channels"
            ];

            if (message.content.includes(internalLink)) isWhitelisted = true;
            if (trustedDomains.some(domain => message.content.toLowerCase().includes(domain))) isWhitelisted = true;

            if (guild.messageFilters.linksWhitelist) {
                const wl = guild.messageFilters.linksWhitelist;
                const isWhitelistedUser = wl.users.includes(message.author.id);
                const isWhitelistedRole = message.member?.roles.cache.some(r => wl.roles.includes(r.id));
                const isWhitelistedChannel = wl.channels.includes(message.channel.id);
                const isAdmin = message.member?.permissions.has("Administrator");
                if (isWhitelistedUser || isWhitelistedRole || isWhitelistedChannel || isAdmin) isWhitelisted = true;
            }

            if (!isWhitelisted) {
                await message.delete().catch(() => { });
                const msg = await message.channel.send(`${emojis.links} <@${message.author.id}> **Links are not allowed in this server!**`);
                setTimeout(() => msg.delete().catch(() => { }), 5000);
                return; // Stop processing further (e.g. spam)
            }
        }
    }

    /* --- ANTI-EVERYONE SYSTEM --- */
    if (guild?.messageFilters.antiEveryone) {
        if (message.content.includes('@everyone') || message.content.includes('@here')) {
            // Check Whitelist (Reuse Spam Whitelist logic or use Admin Check)
            const isAdmin = message.member?.permissions.has("Administrator");
            let isWhitelisted = isAdmin;

            // Optional: Check specific whitelist if implemented, effectively treating it as 'spam' whitelist for now
            if (guild.messageFilters.spamWhitelist) {
                const wl = guild.messageFilters.spamWhitelist;
                if (wl.users.includes(message.author.id) ||
                    message.member?.roles.cache.some(r => wl.roles.includes(r.id)) ||
                    wl.channels.includes(message.channel.id)) {
                    isWhitelisted = true;
                }
            }

            if (!isWhitelisted) {
                await message.delete().catch(() => { });
                const msg = await message.channel.send(`${emojis.error} <@${message.author.id}> **You are not allowed to mention everyone/here!**`);
                setTimeout(() => msg.delete().catch(() => { }), 5000);
                return;
            }
        }
    }

    /* --- ANTI-MASS MENTION SYSTEM --- */
    if (guild?.messageFilters.massMention) {
        const mentionLimit = 7;
        if (message.mentions.users.size > mentionLimit) {
            // Check Whitelist
            const isAdmin = message.member?.permissions.has("Administrator");
            let isWhitelisted = isAdmin;

            if (guild.messageFilters.spamWhitelist) {
                const wl = guild.messageFilters.spamWhitelist;
                if (wl.users.includes(message.author.id) ||
                    message.member?.roles.cache.some(r => wl.roles.includes(r.id)) ||
                    wl.channels.includes(message.channel.id)) {
                    isWhitelisted = true;
                }
            }

            if (!isWhitelisted) {
                await message.delete().catch(() => { });

                // Punish: Mute
                if (message.member && message.member.moderatable) {
                    await message.member.timeout(10 * 60 * 1000, "Anti-Spam: Mass Mention").catch(() => { });
                }

                const msg = await message.channel.send(`${emojis.error} <@${message.author.id}> **Don't mass mention users!** (Muted for 10m)`);
                setTimeout(() => msg.delete().catch(() => { }), 5000);
                return;
            }
        }
    }

    /* --- ANTI-SPAM SYSTEM --- */
    if (guild?.messageFilters.spam) { // Only check if enabled
        // 0. Whitelist Bypass
        let isWhitelisted = false;
        if (guild.messageFilters.spamWhitelist) {
            const wl = guild.messageFilters.spamWhitelist;
            const isWhitelistedUser = wl.users.includes(message.author.id);
            const isWhitelistedRole = message.member?.roles.cache.some(r => wl.roles.includes(r.id));
            const isWhitelistedChannel = wl.channels.includes(message.channel.id);
            const isAdmin = message.member?.permissions.has("Administrator"); // Admins always bypass
            if (isWhitelistedUser || isWhitelistedRole || isWhitelistedChannel || isAdmin) {
                isWhitelisted = true;
            }
        }

        if (isWhitelisted) {
            // Bypass
        } else {
            // 1. Weighted Spam Score System
            const now = Date.now();
            const userKey = `${message.guildId}_${message.author.id}`;

            // Calculate Score for THIS message
            let msgScore = 1; // Base score

            if (message.content.search(linksRegex) > 0) msgScore += 3; // Link Penalty
            if (message.mentions.users.size > 0) msgScore += 4; // Mention Penalty
            if (message.attachments.size > 0) msgScore += 2; // Attachment Penalty

            if (!spamCache.has(userKey)) {
                spamCache.set(userKey, { score: msgScore, lastMessage: message.content, lastTimestamp: now });
            } else {
                const data = spamCache.get(userKey)!;

                // Reset if time window passed (5 seconds)
                if (now - data.lastTimestamp > 5000) {
                    data.score = msgScore;
                    data.lastTimestamp = now;
                    data.lastMessage = message.content;
                } else {
                    data.score += msgScore;

                    // Check for Duplicates (Strict Equality)
                    if (message.content === data.lastMessage && message.content.length > 5) {
                        data.score += 2; // Duplicate Penalty
                    }

                    data.lastMessage = message.content;
                }
                spamCache.set(userKey, data);

                // Threshold: Score >= 7 in 5 seconds
                if (data.score >= 7) {
                    try { fs.appendFileSync('debug.log', `[DEBUG] Filter: Spam Triggered\n`); } catch { }
                    await message.delete().catch(() => { });

                    // Prevent spamming the warning itself
                    if (data.score <= 10) {
                        const warningMsg = await message.channel.send(`${emojis.warning} <@${message.author.id}> **Stop spamming!**\nYour messages are being flagged as spam.`);
                        setTimeout(() => warningMsg.delete().catch(() => { }), 3000);
                    }

                    // High Score -> Mute (e.g., Score 12+)
                    if (data.score >= 12) {
                        if (message.member && message.member.moderatable) {
                            await message.member.timeout(10 * 60 * 1000, "Anti-Spam: Weighted Score Limit Exceeded");
                            const muteMsg = await message.channel.send(`${emojis.error} **${message.author.tag}** has been muted for 10 minutes.`);
                            setTimeout(() => muteMsg.delete().catch(() => { }), 5000);

                            // Reset cache
                            spamCache.delete(userKey);
                        }
                    }
                    return; // Stop processing
                }
            }
        }
    } else {
        // Fallback
    }

    // End of Anti-Spam

    /* --- BLACKLIST SYSTEM (Legacy/To be refactored) --- */
    if (isBadMessage(message.content, guild?.messageFilters.blacklist ? guild.messageFilters.blacklist : [])) {
        if (!message.member?.permissions.has("Administrator")) {
            await message.delete();
            await message.channel.send(
                replaceValues(guild?.messageFilters.messages.blacklist as any, message)
            );
            return;
        }
    }

    /* Media Channel Enforcement */
    if (guild?.mediaChannels.includes(message.channel.id)) {
        const hasMedia = message.attachments.size > 0 || message.content.search(linksRegex) > 0;
        const hasPerms = message.member?.permissions.has("ManageMessages");

        if (!hasMedia && !hasPerms) {
            await message.delete().catch(() => { });
            const warning = await message.channel.send(`${emojis.warning} <@${message.author.id}> This is a media-only channel!`);
            setTimeout(() => warning.delete().catch(() => { }), 5000);
            return;
        }
    }

    /* Prefix & No-Prefix Handling */
    console.log("[DEBUG] Checking Filters...");
    /* --- ANTI-INVITE SYSTEM --- */
    // ... (existing filter code checks, I won't touch them but I assume they are here) ...

    /* (Skipping filter details in this edit for brevity, inserting log before prefix check) */

    // ... (After all filters) ...

    // Note: I will insert the log right before "let commandName;" which is line 427 in original
    const currentPrefix = guild?.prefix || prefix;
    let commandName: string | undefined;
    let args: string[] = [];
    let isNoPrefixAction = false;
    const botConfig = await database.getBotConfig(); // Fetch Global Config

    if (message.content.startsWith(currentPrefix)) {
        args = message.content.slice(currentPrefix.length).trim().split(/ +/);
        commandName = args.shift()?.toLowerCase();
    } else if (botConfig.noPrefixUsers?.includes(message.author.id)) { // Global Check
        const tempArgs = message.content.trim().split(/ +/);
        const tempCommandName = tempArgs[0].toLowerCase();

        // Only trigger if it IS a command
        if (commandHandler.has(tempCommandName)) {
            args = tempArgs;
            commandName = args.shift()?.toLowerCase();
            isNoPrefixAction = true;
        }
    }

    if (commandName) {
        // Global Checks for Prefix Commands
        const botConfig = await database.getBotConfig();
        const isOwner = message.author.id === process.env.OWNER_ID;

        if (botConfig.blacklistedUsers.includes(message.author.id) && !isOwner) return;
        
        // Maintenance Check (Bypass for Owner, Developer, Staff)
        const isStaff = botConfig.staffUsers?.includes(message.author.id);
        const isDev = botConfig.developerUsers?.includes(message.author.id);
        if (botConfig.maintenance && !isOwner && !isDev && !isStaff) return;

        fs.appendFileSync('debug.log', `[DEBUG] Command matched: ${commandName}\n`);

        /* Legacy ?help Handler */
        if (commandName === 'help') {
            const helpArgs = args[0] ? args[0].toLowerCase() : null;
            if (helpArgs) {
                // ... (Logic remains same, just ensure we pass context correctly if needed)
            }
        }
        if (commandName === 'help' && !args.length) {
            // Let generic handler handle it
        }

        const commandModule = commandHandler.get(commandName);
        console.log(`[DEBUG] Handling command: '${commandName}'. Module found: ${!!commandModule}`);
        if (commandModule) {
            fs.appendFileSync('debug.log', `[DEBUG] Module found for: ${commandName}\n`);
            console.log(`[PrefixHandler] Found module for: ${commandName}`);
            try {
                const { command, run } = commandModule;

                // --- HYBRID ARGUMENT PARSER ---
                // Map positional args (args[0], args[1]...) to Named Options in SlashCommandBuilder

                // --- HYBRID ARGUMENT PARSER (FIXED) ---
                let commandData;
                try {
                    commandData = typeof command.toJSON === 'function' ? command.toJSON() : command;
                } catch (e: any) {
                    commandData = { options: [] };
                }
                const rawOptions = commandData.options || [];

                console.log(`[Debug] Command Options (JSON):`, rawOptions.length);

                const optionsMap = new Map<string, any>();
                let subcommandName: string | null = null;
                let groupName: string | null = null; // Unused for now

                let currentArgIndex = 0;

                // 1. Identify Subcommands & Groups
                const subcommands = rawOptions.filter((opt: any) => opt.type === 1 || opt.type === 2);
                let targetOptions = rawOptions; // Default to top-level

                if (subcommands.length > 0 && args.length > 0) {
                    const potentialMatch = subcommands.find((s: any) => s.name === args[0].toLowerCase());

                    if (potentialMatch) {
                        currentArgIndex++; // Consumed first arg

                        if (potentialMatch.type === 2) {
                            // It's a Subcommand Group
                            groupName = potentialMatch.name;
                            const internalSubcommands = potentialMatch.options || [];

                            // Look for the specific subcommand inside the group
                            if (currentArgIndex < args.length) {
                                const subMatch = internalSubcommands.find((s: any) => s.name === args[currentArgIndex].toLowerCase());
                                if (subMatch) {
                                    subcommandName = subMatch.name;
                                    targetOptions = subMatch.options || [];
                                    currentArgIndex++; // Consumed subcommand arg
                                }
                            }
                        } else {
                            // It's a direct Subcommand
                            subcommandName = potentialMatch.name;
                            targetOptions = potentialMatch.options || [];
                        }

                        // Map options for the identified Subcommand (or Group if incomplete, though unlikely to work)
                        for (const opt of targetOptions) {
                            if (currentArgIndex >= args.length) break;

                            let val = args[currentArgIndex];

                            // Greedy String (Type 3) - Last Option
                            if (opt.type === 3 && targetOptions.indexOf(opt) === targetOptions.length - 1) {
                                val = args.slice(currentArgIndex).join(" ");
                                currentArgIndex = args.length;
                            } else {
                                if (opt.type === 7) val = val.replace(/<#|>/g, ''); // Channel
                                val = val.replace(/[<@!&>]/g, ''); // User/Role cleanup
                                currentArgIndex++;
                            }
                            optionsMap.set(opt.name, val);
                        }
                    }
                }

                // If we didn't match a subcommand (or group), fallback to top-level parsing
                if (!subcommandName && !groupName) {
                    // 2. Top Level Options
                    const topOptions = rawOptions.filter((opt: any) => opt.type !== 1 && opt.type !== 2);
                    const skippedIntOptions: any[] = [];

                    for (const opt of topOptions) {
                        if (currentArgIndex >= args.length) break;

                        let val = args[currentArgIndex];

                        // Smart Parsing: Skip Integer option if arg is NOT a number (and likely a mention)
                        if ((opt.type === 4 || opt.type === 10) && isNaN(parseInt(val))) {
                            // Only skip if not required? For now, we assume flexible.
                            if (!opt.required) {
                                console.log(`[SmartParse] Skipping option '${opt.name}' (Expected Int, got '${val}')`);
                                skippedIntOptions.push(opt);
                                continue;
                            }
                        }

                        // Smart Parsing: Skip User option (Type 6) if arg is 'bot' or 'bots' (likely a boolean flag)
                        if (opt.type === 6 && (val.toLowerCase() === 'bot' || val.toLowerCase() === 'bots')) {
                            if (!opt.required) {
                                console.log(`[SmartParse] Skipping option '${opt.name}' (got keyword '${val}')`);
                                continue;
                            }
                        }

                        if (opt.type === 3 && topOptions.indexOf(opt) === topOptions.length - 1) {
                            val = args.slice(currentArgIndex).join(" ");
                            currentArgIndex = args.length;
                        } else {
                            if (opt.type === 7) val = val.replace(/<#|>/g, '');
                            val = val.replace(/[<@!&>]/g, '');
                            // Auto-fetch
                            try {
                                if (message.guild) {
                                    if (opt.type === 6) await message.guild.members.fetch(val).catch(() => { });
                                    if (opt.type === 9 || opt.type === 8) await message.guild.roles.fetch(val).catch(() => { });
                                }
                                await message.client.users.fetch(val).catch(() => { });
                            } catch (e) { }

                            currentArgIndex++;
                        }
                        optionsMap.set(opt.name, val);
                    }

                    // Post-Loop: Check for leftover args and fill skipped Integer options
                    // Example: ?purge bots 50 -> 'bots' matched, '50' remaining. 'amount' was skipped.
                    while (currentArgIndex < args.length && skippedIntOptions.length > 0) {
                        const val = args[currentArgIndex];
                        if (!isNaN(parseInt(val))) {
                            const opt = skippedIntOptions.shift();
                            console.log(`[SmartParse] Late-filling option '${opt.name}' with '${val}'`);
                            optionsMap.set(opt.name, val);
                            currentArgIndex++;
                        } else {
                            break; // Remaining arg is not an int, stop trying to fill
                        }
                    }
                }


                // Reply Shim with Auto-Embed
                let replyMessage: any = null;

                const replyHandler = async (payload: any) => {
                    let finalPayload = payload;
                    if (typeof payload === 'string') {
                        finalPayload = new V2Embed().setDescription(payload).setColor(0x2f3136).toPayload();
                    } else if (payload instanceof V2Embed) {
                        finalPayload = payload.toPayload();
                    } else if (payload?.content && !payload?.components && !payload?.embeds) {
                        finalPayload = new V2Embed().setDescription(payload.content).setColor(0x2f3136).toPayload({
                            ephemeral: payload.ephemeral
                        });
                    }

                    const { ephemeral, fetchReply, ...rest } = finalPayload;
                    const msgPayload = { ...rest, allowedMentions: { repliedUser: false } };

                    if (replyMessage) {
                        return await replyMessage.edit(msgPayload);
                    } else {
                        if (!message.channel) return null;
                        try {
                            replyMessage = await message.reply({ ...msgPayload, failIfNotExists: false });
                        } catch (e) {
                            // Fallback if reply fails (e.g. message deleted)
                            replyMessage = await message.channel.send(msgPayload).catch(() => null);
                        }
                        return replyMessage;
                    }
                };

                const mockInteraction: any = {
                    client: message.client,
                    user: message.author,
                    member: message.member || await message.guild?.members.fetch(message.author.id).catch(() => null),
                    memberPermissions: message.member?.permissions,
                    guild: message.guild,
                    guildId: message.guildId,
                    channel: message.channel,
                    channelId: message.channelId,
                    commandName: commandName,
                    id: message.id,
                    content: message.content, // Crucial for legacy parsing
                    message: message, // Expose original message for legacy commands
                    createdTimestamp: message.createdTimestamp,
                    isChatInputCommand: () => true,
                    isCommand: () => true, // Fix for legacy checks
                    isButton: () => false,
                    isModalSubmit: () => false,
                    isStringSelectMenu: () => false,
                    isAnySelectMenu: () => false,

                    // Options Shim
                    options: {
                        getSubcommand: () => subcommandName,
                        getSubcommandGroup: () => groupName,
                        getString: (name: string) => optionsMap.get(name) || null,
                        getChannel: (name: string) => {
                            const id = optionsMap.get(name);
                            if (!id) return null;
                            return message.guild?.channels.cache.get(id) || null;
                        },
                        getUser: (name: string) => {
                            const id = optionsMap.get(name);
                            if (!id) return null;
                            return message.client.users.cache.get(id) || null;
                        },
                        getRole: (name: string) => {
                            const id = optionsMap.get(name);
                            if (!id) return null;
                            return message.guild?.roles.cache.get(id) ||
                                message.guild?.roles.cache.find(r => r.name === id) ||
                                message.guild?.roles.cache.find(r => r.name.toLowerCase() === id.toLowerCase()) || null;
                        },
                        getMember: (name: string) => {
                            const id = optionsMap.get(name);
                            if (!id) return null;
                            return message.guild?.members.cache.get(id) || null;
                        },
                        getInteger: (name: string) => {
                            const val = optionsMap.get(name);
                            return val ? parseInt(val) : null;
                        },
                        getBoolean: (name: string) => {
                            const val = optionsMap.get(name);
                            if (!val) return false;
                            const lower = val.toLowerCase();
                            return ['true', 'yes', '1', 'on', 'enable', 'enabled'].includes(lower);
                        },
                        getAttachment: (name: string) => {
                            return message.attachments.first() || null;
                        }
                    },

                    reply: replyHandler,
                    deferReply: async () => { await message.channel.sendTyping(); },
                    editReply: replyHandler,
                    deleteReply: async () => {
                        if (replyMessage) {
                            await replyMessage.delete().catch(() => { });
                            replyMessage = null;
                        }
                    },
                    followUp: async (payload: any) => {
                        // followUp should ideally return a NEW message, but for simple shim, reply is okay.
                        // However, to mimic 'new message', we force a new reply if specifically asked, 
                        // but usually followUp is just "send another message".
                        // For SAFETY in this context, let's treat it as a new reply.
                        let finalPayload = payload;
                        if (typeof payload === 'string') {
                            finalPayload = new V2Embed().setDescription(payload).setColor(0x2f3136).toPayload();
                        } else if (payload instanceof V2Embed) {
                            finalPayload = payload.toPayload();
                        } else if (payload?.content && !payload?.components && !payload?.embeds) {
                            finalPayload = new V2Embed().setDescription(payload.content).setColor(0x2f3136).toPayload({
                                ephemeral: payload.ephemeral
                            });
                        }
                        const { ephemeral, fetchReply, ...rest } = finalPayload;
                        const msgPayload = { ...rest, allowedMentions: { repliedUser: false } };
                        return await message.reply(msgPayload);
                    },

                    // Permission Helpers
                    isRepliable: () => true,
                    inCachedGuild: () => true
                };

                // Basic Validation for Required Options?
                // Command might fail inside 'run' if getOption returns null for required.
                // But let's let command handle it or fail gracefully.

                try {
                    console.log(`[PrefixHandler] Executing run for: ${commandName}`);
                    await run(mockInteraction as unknown as ChatInputCommandInteraction, database);
                    console.log(`[PrefixHandler] Execution complete for: ${commandName}`);
                } catch (error) {
                    console.error(`[PrefixHandler] Error executing ${commandName}:`, error);
                    let errorMessage = "Unknown error";
                    if (error instanceof Error) {
                        console.error(error.stack);
                        errorMessage = error.message;
                    }
                    await message.reply(`${emojis.error} Error executing command: \`${errorMessage}\``);
                }
            } catch (err: any) {
                fs.appendFileSync('debug.log', `[CRITICAL] Error in Prefix Handler Block: ${err.message}\n`);
                console.error(err);
            }
        }
    }


});



import { handleInteraction as handleHelpInteraction } from "./commands/extra/help";

import { handleInteraction as handleDevInteraction } from "./commands/owner/dev";
import { handleInteraction as handleTranslateInteraction } from "./commands/extra/translate";
// import { handleInteraction as handleEmbedInteraction } from "./commands/utility/embed";

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const botConfig = await database.getBotConfig();
        const isOwner = interaction.user.id === process.env.OWNER_ID;

        // Global Blacklist Check
        if (botConfig.blacklistedUsers.includes(interaction.user.id) && !isOwner) {
            return interaction.reply({ content: `${emojis.error} **You are blacklisted from using this bot.**`, ephemeral: true });
        }

        // Maintenance Mode Check
        if (botConfig.maintenance && !isOwner) {
            return interaction.reply({ content: `${emojis.warning} **System is currently in Maintenance Mode.**`, ephemeral: true });
        }


        const commandModule = commandHandler.get(interaction.commandName);
        if (!commandModule) return;

        try {
            await commandModule.run(interaction, database);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    } else if (interaction.isButton() || interaction.isModalSubmit() || interaction.isAnySelectMenu()) {
        if (interaction.customId === 'giveaway_enter') {
            await giveawayHandler.handleEntry(interaction as any);
        } else if (interaction.customId.startsWith('help_')) {
            await handleHelpInteraction(interaction as any, database);
        } else if (interaction.customId.startsWith('dev_')) {
            await handleDevInteraction(interaction as any, database);
        } else if (interaction.customId.startsWith('translate_')) {
            await handleTranslateInteraction(interaction as any, database);
        }
        // else if (interaction.customId.startsWith('embed_')) {
        //     await handleEmbedInteraction(interaction as any, database);
        // }
    }
});

client.on("messageDelete", (message) => {
    handleSnipe(message);
});

/* Go to src/config.json and put your token there */
/* Go to src/config.json and put your token there */
client.login(token).catch(e => {
    console.error("[CRITICAL] Failed to login to Discord:");
    console.error(e);
    // Specifically check for DisallowedIntents
    if (e.code === 'DisallowedIntents') {
        console.error(">>> SOLUTION: Go to https://discord.com/developers/applications, select your bot, go to 'Bot' tab, and ENABLE all Privileged Gateway Intents (Presence, Server Members, Message Content).");
    } else if (e.code === 'TokenInvalid') {
        console.error(">>> SOLUTION: Your Bot Token is invalid. Regenerate it in the Developer Portal and update your hosting environment variables.");
    }
});
