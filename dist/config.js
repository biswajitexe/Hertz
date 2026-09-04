"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modules = exports.emojis = exports.colors = exports.botInfo = exports.prefix = void 0;
exports.prefix = '?';
exports.botInfo = {
    commandsLink: "https://discord.gg/suttabar",
    tosLink: "https://github.com/yourusername/repository/blob/main/TERMS_OF_SERVICE.md"
};
exports.colors = {
    default: 0x2B2D31,
    primary: 0x2B2D31,
    success: 0x2B2D31,
    error: 0x2B2D31,
    warning: 0x2B2D31
};
exports.emojis = {
    switch_on: "<:icon_switch_on:1540796537850826773>",
    switch_off: "<:icon_switch_off:1540796534126547095>",
    correct: "<:icons_Correct:1540796610395644084>",
    wrong: "<:icons_Wrong:1540796860610904074>",
    success: "<:icons_Correct:1540796610395644084>",
    error: "<:icons_Wrong:1540796860610904074>",
    warning: "<:icon_warning:1540796549913911356>",
    antinuke: "<:Icons_Guardian:1540796669262692382>",
    moderation: "<:icon_moderation:1540796498416107601>",
    automod: "<:icons_settings:1540796798392864798>",
    giveaways: "<:icons_gift:1540796655622946897>",
    welcomer: "<:icons_join:1540796695187685477>",
    media: "<:icons_image:1540796687407251517>",
    extra: "<:Icons_utility:1540796849642938518>",
    dev: "<:icon_developer:1540796458037674004>",
    module: "<:icons_folder:1540796650426073188>",
    ban: "<:icons_ban:1540796568372781147>",
    kick: "<:icons_kick:1540796698270376066>",
    timeout: "<:icons_timeout:1540796829816463420>",
    mute: "<:icons_micmute:1540796746169585885>",
    unban: "<:icon_unban:1540796544150802432>",
    lock: "<:icon_lock:1540796480879595560>",
    locked: "<:icons_locked:1540796729711009914>",
    unlock: "<:icons_unlock:1540796836548182149>",
    delete: "<:icon_delete:1540796451549089912>",
    clear: "<:icon_clear:1540796447161847888>",
    channel: "<:icons_channel:1540796587033501877>",
    role: "<:LPF_icon_roles:1540796865543405678>",
    roles: "<:LPF_icon_roles:1540796865543405678>",
    human: "<:icons_human:1540796675227001012>",
    bot: "<:icons_bot:1540796571061583913>",
    owner: "<:icon_owner:1540796504619491470>",
    ping: "<:icons_ping:1540796768785272872>",
    goodping: "<:icons_goodping:1540796666653843497>",
    badping: "<:icons_badping:1540796564438655217>",
    slash: "<:icon_slash:1540796523527278602>",
    link: "<:icons_link:1540796717996183572>",
    invite: "<:icons_invite:1540796692679622746>",
    info: "<:icons_info:1540796689823170640>",
    rules: "<:icon_rules:1540796518238523402>",
    pin: "<:icons_pin:1540796766134214746>",
    ticket: "<:icon_ticket:1540796540963135550>",
    clock: "<:icons_clock:1540796592557129768>",
    settings: "<:icons_settings:1540796798392864798>",
    logging: "<:icon_logging:1540796484566384650>",
    logchannel: "<:icon_logging:1540796484566384650>",
    stats: "<:icon_Stats:1540796527759331368>",
    support: "<:icon_support:1540796530573836400>",
    backpack: "<:icon_backpack:1540796437686915093>",
    tada: "<:icons_tada:1540796823852159017>",
    gift: "<:icons_gift:1540796655622946897>",
    premium: "<:Icon_Premium:1540796514639806525>",
    vip: "<:spy_icons_vip:1540796876683612160>",
    verified: "<:icons_verified:1540796852524421230>",
    staff: "<:icons_staff:1540796809574613042>",
    member: "<:icons_human:1540796675227001012>",
    message: "<:icons_message:1540796742432329909>",
    online: "<:icons_online:1540796752964100138>",
    offline: "<:icons_offline:1540796751026593932>",
    idle: "<:icons_idle:1540796684034900130>",
    dnd: "<:icons_dred:1540796626845565098>",
    right_arrow: "<:icons_rightarrow:1540796787965689956>",
    left_arrow: "<:icons_leftarrow:1540796714506653707>",
    home: "<:icon_home:1540796472730066965>",
    music: "<:icon_music:1540796502052569158>",
    mention: "<:icon_mention:1540796489196896266>",
    star: "<:icons_star:1540796816302276688>",
    dot: "•"
};
exports.modules = {
    antinuke: {
        name: "Antinuke",
        description: "Advanced server protection system.",
        commands: [
            { name: "antinuke", usage: "antinuke <enable/disable/show>", description: "Main Antinuke Command" },
            { name: "antinuke enable", usage: "antinuke enable", description: "Enable Antinuke" },
            { name: "antinuke disable", usage: "antinuke disable", description: "Disable Antinuke" },
            { name: "antinuke show", usage: "antinuke show", description: "Show Antinuke Settings" },
            { name: "whitelist add", usage: "whitelist add <category> <user>", description: "Add user to whitelist" },
            { name: "whitelist remove", usage: "whitelist remove <category> <user>", description: "Remove user from whitelist" },
            { name: "whitelist show", usage: "whitelist show <category>", description: "Show whitelisted users" },
            { name: "whitelist reset", usage: "whitelist reset <category>", description: "Reset whitelist" },
            { name: "extraowner add", usage: "extraowner add <user>", description: "Add an Extra Owner" },
            { name: "extraowner remove", usage: "extraowner remove <user>", description: "Remove an Extra Owner" },
            { name: "extraowner show", usage: "extraowner show", description: "Show Extra Owners" },
            { name: "extraadmin add", usage: "extraadmin add <user>", description: "Add an Extra Admin" },
            { name: "extraadmin remove", usage: "extraadmin remove <user>", description: "Remove an Extra Admin" },
            { name: "extraadmin show", usage: "extraadmin show", description: "Show Extra Admins" }
        ]
    },
    automod: {
        name: "AutoMod",
        description: "Automated moderation systems.",
        commands: [
            { name: "antiping", usage: "antiping <enable/disable/status>", description: "Manage Anti-Ping (Mass Mention)" },
            { name: "antiping enable", usage: "antiping enable", description: "Enable Anti-Ping" },
            { name: "antiping disable", usage: "antiping disable", description: "Disable Anti-Ping" },
            { name: "antispam", usage: "antispam <enable/disable/status>", description: "Manage Anti-Spam" },
            { name: "antispam enable", usage: "antispam enable", description: "Enable Anti-Spam" },
            { name: "antispam disable", usage: "antispam disable", description: "Disable Anti-Spam" },
            { name: "antilink", usage: "antilink <enable/disable/status>", description: "Manage Anti-Link" },
            { name: "antilink enable", usage: "antilink enable", description: "Enable Anti-Link" },
            { name: "antilink disable", usage: "antilink disable", description: "Disable Anti-Link" },
            { name: "antiinvite", usage: "antiinvite <enable/disable/status>", description: "Manage Anti-Invite" },
            { name: "antiinvite enable", usage: "antiinvite enable", description: "Enable Anti-Invite" },
            { name: "antiinvite disable", usage: "antiinvite disable", description: "Disable Anti-Invite" },
            { name: "antieveryone", usage: "antieveryone <enable/disable/status>", description: "Manage Anti-Everyone" },
            { name: "antieveryone enable", usage: "antieveryone enable", description: "Enable Anti-Everyone" },
            { name: "antieveryone disable", usage: "antieveryone disable", description: "Disable Anti-Everyone" }
        ]
    },
    moderation: {
        name: "Moderation",
        description: "Commands to manage the server and users.",
        commands: [
            { name: "ban", usage: "ban <user> <reason> | unban <user>", description: "Ban a user from the guild" },
            { name: "unban", usage: "unban <id>", description: "Unban a user" },
            { name: "kick", usage: "kick <user> <reason>", description: "Kick a user from the guild" },
            { name: "mute", usage: "mute <user> <time> <reason>", description: "Mute a user" },
            { name: "unmute", usage: "unmute <user>", description: "Unmute a user" },
            { name: "timeout", usage: "timeout <user> <time> <reason>", description: "Timeout a user" },
            { name: "warn", usage: "warn <subcommand>", description: "Manage warnings" },
            { name: "warn add", usage: "warn add <user> <reason>", description: "Warn a user" },
            { name: "warn list", usage: "warn list <user>", description: "Check warns" },
            { name: "warn remove", usage: "warn remove <user> <id>", description: "Delete a warning" },
            { name: "warn clear", usage: "warn clear <user>", description: "Clear all warnings" },
            { name: "lock", usage: "on | off", description: "Lock/Unlock channel" },
            { name: "unlock", usage: "unlock <channel>", description: "Unlock channel" },
            { name: "hide", usage: "on | off", description: "Hide/Unhide channel" },
            { name: "unhide", usage: "unhide <channel>", description: "Unhide channel" },
            { name: "purge", usage: "purge <amount>", description: "Delete recent messages" },
            { name: "purge <@user>", usage: "purge <@user> [amount]", description: "Delete messages from a specific user" },
            { name: "purge bots", usage: "purge bots [amount] | purge bot [amount]", description: "Delete messages from bots" },
            { name: "nuke", usage: "", description: "Clone & Delete channel" },
            { name: "lockall", usage: "", description: "Lock all channels" },
            { name: "unlockall", usage: "", description: "Unlock all channels" },
            { name: "hideall", usage: "", description: "Unhide all channels" },
            { name: "unhideall", usage: "", description: "Unhide all channels" },
            { name: "role", usage: "role <user> <role>", description: "Manage roles" },
            { name: "roleall", usage: "add/remove <role>", description: "Role all members" },
            { name: "setnick", usage: "setnick <user> <nick>", description: "Change nickname" },
            { name: "steal", usage: "emoji | sticker", description: "Steal emoji/sticker" },
            { name: "softban", usage: "softban <user> <reason>", description: "Softban a user (Kick + Delete Messages)" },
            { name: "fuckban", usage: "fuckban <user> <reason>", description: "Hard ban a user (Aggressive DM)" },
            { name: "warnkick", usage: "warnkick <user> <reason>", description: "Kick user with invite link (Warning)" },
            { name: "unbanall", usage: "unbanall", description: "Unban all users" },
            { name: "snipe", usage: "", description: "Snipe last deleted message" },
            { name: "snipeall", usage: "", description: "Snipe history" },
            { name: "list", usage: "list <roles/bots/admins/inrole>", description: "List server entities" },
            { name: "afk", description: "Set AFK status" },
            { name: "ping", description: "Check latency" }
        ]
    },
    welcomer: {
        name: "Welcomer",
        description: "Configure custom welcome messages and autoroles.",
        commands: [
            { name: "autorole", usage: "add | remove | list", description: "Manage automatic roles" },
            { name: "autorole humans", usage: "autorole humans <add/remove> <role>", description: "Manage human autoroles" },
            { name: "autorole bots", usage: "autorole bots <add/remove> <role>", description: "Manage bot autoroles" },
            { name: "autorole show", usage: "autorole show", description: "Show configured roles" },
            { name: "autorole reset", usage: "autorole reset", description: "Reset all autoroles" }
        ]
    },
    media: {
        name: "Media",
        description: "Manage media-only channels.",
        commands: [
            { name: "media", usage: "media setup | remove | show", description: "Main Media Command" },
            { name: "media setup", usage: "media setup <channel>", description: "Set media-only channel" },
            { name: "media remove", usage: "media remove <channel>", description: "Remove media-only channel" },
            { name: "media show", usage: "media show", description: "Show media-only channels" }
        ]
    },
    giveaways: {
        name: "Giveaways",
        description: "Host and manage giveaways.",
        commands: [
            { name: "giveaway", usage: "giveaway <subcommand>", description: "Main Giveaway Command" },
            { name: "gstart", usage: "gstart <time> <winners> <prize>", description: "Start a giveaway" },
            { name: "gend", usage: "gend <message_id>", description: "End a giveaway" },
            { name: "greroll", usage: "greroll <message_id>", description: "Reroll a winner" },
            { name: "gpause", usage: "gpause <message_id>", description: "Pause a giveaway" },
            { name: "gresume", usage: "gresume <message_id>", description: "Resume a giveaway" },
            { name: "glist", usage: "glist", description: "List active giveaways" }
        ]
    },
    extra: {
        name: "Extra",
        description: "Extra commands and settings.",
        commands: [
            { name: "prefix", usage: "prefix <set/reset>", description: "Manage custom prefix" },
            { name: "profile", usage: "profile [user]", description: "View user profile" },
            { name: "prefix set", usage: "prefix set <new_prefix>", description: "Set server prefix" },
            { name: "prefix reset", usage: "prefix reset", description: "Reset server prefix" },
            { name: "translate", usage: "translate <text> [to]", description: "Translate text (supports reply)" },
            { name: "large", usage: "large <emoji>", description: "Enlarge custom emoji (supports reply)" },
            { name: "help", description: "View help menu" },
            { name: "about", description: "About the bot" },
            { name: "avatar", description: "Get user avatar" },
            { name: "banner", description: "Get user banner" },
            { name: "invite", description: "Get invite link" },
            { name: "botinfo", description: "Display bot information" },
            { name: "serverinfo", description: "Display server information" },
            { name: "userinfo", description: "Display user information" },
            { name: "membercount", description: "Check member count" }
        ]
    },
    dev: {
        name: "Developer",
        description: "Bot developer and management commands.",
        commands: [
            { name: "owner", usage: "owner <add/remove/list>", description: "Manage Owners" },
            { name: "developer", usage: "developer <add/remove/list>", description: "Manage Developers" },
            { name: "admin", usage: "admin <add/remove/list>", description: "Manage Admins" },
            { name: "staff", usage: "staff <add/remove/list>", description: "Manage Staff" },
            { name: "supporter", usage: "supporter <add/remove/list>", description: "Manage Supporters" },
            { name: "partner", usage: "partner <add/remove/list>", description: "Manage Partners" },
            { name: "vip", usage: "vip <add/remove/list>", description: "Manage VIPs" },
            { name: "noprefix", usage: "noprefix <add/remove/list>", description: "Manage No Prefix Users" },
            { name: "eval", description: "Evaluate code" },
            { name: "shell", description: "Run shell commands" }
        ]
    }
};
