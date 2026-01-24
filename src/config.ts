export const prefix = '?'; // Using slash commands primarily

export const botInfo = {
    commandsLink: "https://discord.gg/suttabar", // Updated to match bot name
    tosLink: "https://github.com/yourusername/repository/blob/main/TERMS_OF_SERVICE.md" // Replace with your actual URL
};

export const emojis: { [key: string]: string } = {
    module: "<:iconfolder:1458160174815514670>",
    antinuke: "<:48120voicechannellocked:1460950702884130836>",
    moderation: "<:iconshammer18:1380525228857229362>",
    automod: "<:iconsettings9:1458160125813588069>",
    giveaways: "<:astgiveaway:1458158989693943969>",
    voice: "<:volumeup:1380525199560015932>",
    media: "<:7291mediaadd:1464533585477374107>",
    welcomer: "<:icons_join23:1458161769905131633>",
    extra: "<:carpeunlock:1458160337789518051>",
    success: "<:icocorrect46:1458159679988432948>",
    error: "<:wrong33:1458159746895843368>",
    warning: "<:icons_warning:1458158728049070257>",
    delete: "<:icon_delete:1380525257303130222>",
    links: "<:iconlink:1380534603567333467>",
    home: "<:home6:1380534406162419793>",
    commands: "<:hparchive:1380534477297553419>",
    ban: "<:iconsban:1380540975021166603>",
    kick: "<:icons_kick:1380541661008101456>",
    logchannel: "<:boatlogging22:1380534070903308350>",
    instagram: "<:mmm:1380769703433207898>",
    website: "<:siyah_web55:1380771488495439963>",
    discord: "<:DiscordIcon:1380773511957581985>",
    github: "<:github:1380773486754136084>",
    owner: "<:icons_owner:1380786034614210610>",
    bluearrow: "<:bluearrow:1380795464580075680>",
    dot: "<:apinkdot:1459575341634027758>",
    right_arrow: "<:bluearrow1:1381949204728909917>",
    left_arrow: "<:pepinkarrowleft5:1381949286270632038>",
    delete2: "<:icons_delete:1381950253129011291>",
    blush: "<:blushing:1382007588056469664>",
    giveaway: "<:astgiveaway:1458158989693943969>",
    pause: "<:icons_pause:1384099266984673351>",
    end: "<:cend:1384099240627933275>",
    online: "<:_1:1385011550657577061>",
    offline: "<:PunOko20:1385011588880142396>",
    dnd: "<:dnd:1385011616696893546>",
    idle: "<:boat_idle:1385011643989102683>",
    user: "<:online:1458160864032194591>",
    member: "<:Member1:1459604921451020472>",
    role: "<:hds_roles:1385014066837327923>",
    staff: "<:nashe_staff:1385197969552314500>",
    mod: "<:sg_modrator:1385373510486065332>",
    admin: "<:senior_admin:1385373516194648165>",
    manager: "<:llw_role_manager:1385224759574532201>",
    supporter: "<:blurple_early_supporter84:1385196192689815674>",
    developer: "<:esdeveloperbadge:1385196366611091517>",
    owners: "<:Devilscrown:1385197905501097984>",
    noprefix: "<:z_premium:1385210766457831434>",
    settings: "<:iconssettings58:1380534732936319048>",
    general: "<:hparchive:1380534477297553419>",
    afk: "<:6858aventurinebye:1464310768366522616>",
};

export const colors = {
    primary: 0x00AAFF, // Electric Blue from PFP
    success: 0x00FF00,
    error: 0xFF0000,
    warning: 0xFFA500
};

export const modules: { [key: string]: { name: string, description: string, commands: { name: string, usage?: string, description: string }[] } } = {
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
            { name: "noprefix", usage: "noprefix <add/remove/list>", description: "Manage no-prefix users" },
            { name: "noprefix add", usage: "noprefix add <user>", description: "Add user to no-prefix" },
            { name: "noprefix remove", usage: "noprefix remove <user>", description: "Remove user from no-prefix" },
            { name: "noprefix list", usage: "noprefix list", description: "List no-prefix users" },
            // Roles Commands
            { name: "reactionrole", usage: "reactionrole <subcommand>", description: "Manage reaction roles" },
            { name: "reactionrole panel", usage: "reactionrole panel <create/delete>", description: "Manage panel reaction roles" },
            { name: "reactionrole color", usage: "reactionrole color <setup/add/remove>", description: "Manage color reaction roles" },
            { name: "color", usage: "color <hex/name>", description: "Change your name color" },
            // Information Commands
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
    }
};
