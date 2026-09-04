export const prefix = '?'; // Using slash commands primarily

export const botInfo = {
    commandsLink: "https://discord.gg/suttabar", // Updated to match bot name
    tosLink: "https://github.com/yourusername/repository/blob/main/TERMS_OF_SERVICE.md" // Replace with your actual URL
};

export const colors = {
    default: 0x2B2D31,
    primary: 0x2B2D31,
    success: 0x2B2D31,
    error: 0x2B2D31,
    warning: 0x2B2D31
};

export const emojis: { [key: string]: string } = {
    // Status & Toggles (From assets/emoji2)
    switch_on: "<:icon_switch_on:1540796537850826773>",
    switch_off: "<:icon_switch_off:1540796534126547095>",
    correct: "<:icons_Correct:1540796610395644084>",
    wrong: "<:icons_Wrong:1540796860610904074>",
    success: "<:icons_Correct:1540796610395644084>",
    error: "<:icons_Wrong:1540796860610904074>",
    warning: "<:icon_warning:1540796549913911356>",

    // System & Modules (From assets/emoji2)
    antinuke: "<:Icons_Guardian:1540796669262692382>",
    moderation: "<:icon_moderation:1540796498416107601>",
    automod: "<:icons_settings:1540796798392864798>",
    giveaways: "<:icons_gift:1540796655622946897>",
    welcomer: "<:icons_join:1540796695187685477>",
    media: "<:icons_image:1540796687407251517>",
    extra: "<:Icons_utility:1540796849642938518>",
    dev: "<:icon_developer:1540796458037674004>",
    module: "<:icons_folder:1540796650426073188>",

    // Actions & Tools (From assets/emoji2)
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

    // Entities & Badges (From assets/emoji2)
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

export const modules: { [key: string]: { name: string, description: string, commands: { name: string, usage?: string, description: string }[] } } = {
    antinuke: {
        name: "Antinuke",
        description: "Advanced server protection and security system.",
        commands: [
            { name: "antinuke", usage: "antinuke <enable/disable/show>", description: "Configure Antinuke system" },
            { name: "whitelist", usage: "whitelist <add/remove/show/reset>", description: "Manage whitelisted users & roles" },
            { name: "extraowner", usage: "extraowner <add/remove/show>", description: "Manage extra owners" },
            { name: "extraadmin", usage: "extraadmin <add/remove/show>", description: "Manage extra admins" }
        ]
    },
    automod: {
        name: "AutoMod",
        description: "Automated server moderation and protection filters.",
        commands: [
            { name: "antispam", usage: "antispam <enable/disable/status>", description: "Manage Anti-Spam filter" },
            { name: "antilink", usage: "antilink <enable/disable/status>", description: "Manage Anti-Link filter" },
            { name: "antiinvite", usage: "antiinvite <enable/disable/status>", description: "Manage Anti-Invite filter" },
            { name: "antieveryone", usage: "antieveryone <enable/disable/status>", description: "Manage Anti-Everyone filter" },
            { name: "antiping", usage: "antiping <enable/disable/status>", description: "Manage Anti-Mass-Mention filter" }
        ]
    },
    moderation: {
        name: "Moderation",
        description: "Comprehensive moderation tools to manage members.",
        commands: [
            { name: "ban", usage: "ban <user> [reason]", description: "Ban a member" },
            { name: "unban", usage: "unban <id>", description: "Unban a user" },
            { name: "kick", usage: "kick <user> [reason]", description: "Kick a member" },
            { name: "mute", usage: "mute <user> <time> [reason]", description: "Timeout a member" },
            { name: "unmute", usage: "unmute <user>", description: "Remove timeout from member" },
            { name: "warn", usage: "warn <add/remove/list/clear>", description: "Manage member warnings" },
            { name: "warnkick", usage: "warnkick <user> [reason]", description: "Kick member with invite link" },
            { name: "softban", usage: "softban <user> [reason]", description: "Kick member and clear messages" },
            { name: "lock", usage: "lock", description: "Lock current channel" },
            { name: "unlock", usage: "unlock", description: "Unlock current channel" },
            { name: "lockall", usage: "lockall", description: "Lock all server channels" },
            { name: "unlockall", usage: "unlockall", description: "Unlock all server channels" },
            { name: "hide", usage: "hide", description: "Hide current channel" },
            { name: "unhide", usage: "unhide", description: "Unhide current channel" },
            { name: "hideall", usage: "hideall", description: "Hide all server channels" },
            { name: "unhideall", usage: "unhideall", description: "Unhide all server channels" },
            { name: "purge", usage: "purge <amount>", description: "Purge messages" },
            { name: "nuke", usage: "nuke", description: "Clone and delete current channel" },
            { name: "role", usage: "role <user> <role>", description: "Assign or remove a role" },
            { name: "roleall", usage: "roleall <add/remove> <role>", description: "Assign or strip role from all members" },
            { name: "setnick", usage: "setnick <user> <name>", description: "Change member nickname" },
            { name: "steal", usage: "steal <emoji>", description: "Steal emoji into the server" },
            { name: "unbanall", usage: "unbanall", description: "Unban all banned users" },
            { name: "snipe", usage: "snipe", description: "Retrieve last deleted message" },
            { name: "snipeall", usage: "snipeall", description: "List recent deleted messages" },
            { name: "list", usage: "list <roles/bots/admins/inrole>", description: "List server entities" },
            { name: "afk", usage: "afk [reason]", description: "Set your AFK status" },
            { name: "ping", usage: "ping", description: "Check bot latency" }
        ]
    },
    welcomer: {
        name: "Welcomer",
        description: "Automatic role assignment for new members.",
        commands: [
            { name: "autorole", usage: "autorole <humans/bots/show/reset>", description: "Configure automatic roles" }
        ]
    },
    media: {
        name: "Media",
        description: "Restrict channels to media and images only.",
        commands: [
            { name: "media", usage: "media <setup/remove/show>", description: "Manage media channels" }
        ]
    },
    giveaways: {
        name: "Giveaways",
        description: "Create and manage interactive giveaways.",
        commands: [
            { name: "giveaway", usage: "giveaway", description: "Main giveaway menu" },
            { name: "gstart", usage: "gstart <time> <winners> <prize>", description: "Start a giveaway" },
            { name: "gend", usage: "gend <message_id>", description: "End a giveaway" },
            { name: "greroll", usage: "greroll <message_id>", description: "Reroll a giveaway winner" },
            { name: "gpause", usage: "gpause <message_id>", description: "Pause a giveaway" },
            { name: "gresume", usage: "gresume <message_id>", description: "Resume a giveaway" },
            { name: "glist", usage: "glist", description: "List active giveaways" }
        ]
    },
    extra: {
        name: "Extra",
        description: "Utility and informational commands.",
        commands: [
            { name: "prefix", usage: "prefix <set/reset>", description: "Manage server prefix" },
            { name: "profile", usage: "profile [user]", description: "View user profile card" },
            { name: "translate", usage: "translate <text> [to]", description: "Translate text" },
            { name: "large", usage: "large <emoji>", description: "Enlarge custom emoji" },
            { name: "help", usage: "help [command]", description: "View help panel" },
            { name: "about", usage: "about", description: "Information about Hertz" },
            { name: "avatar", usage: "avatar [user]", description: "Get user avatar" },
            { name: "banner", usage: "banner [user]", description: "Get user banner" },
            { name: "invite", usage: "invite", description: "Get bot invite link" },
            { name: "botinfo", usage: "botinfo", description: "System and bot statistics" },
            { name: "serverinfo", usage: "serverinfo", description: "Detailed server information" },
            { name: "userinfo", usage: "userinfo [user]", description: "Detailed user information" },
            { name: "membercount", usage: "membercount", description: "Show member statistics" }
        ]
    },
    dev: {
        name: "Developer",
        description: "Bot developer and maintenance commands.",
        commands: [
            { name: "owner", usage: "owner <add/remove/list>", description: "Manage Owners" },
            { name: "developer", usage: "developer <add/remove/list>", description: "Manage Developers" },
            { name: "admin", usage: "admin <add/remove/list>", description: "Manage Admins" },
            { name: "staff", usage: "staff <add/remove/list>", description: "Manage Staff" },
            { name: "supporter", usage: "supporter <add/remove/list>", description: "Manage Supporters" },
            { name: "partner", usage: "partner <add/remove/list>", description: "Manage Partners" },
            { name: "vip", usage: "vip <add/remove/list>", description: "Manage VIPs" },
            { name: "noprefix", usage: "noprefix <add/remove/list>", description: "Manage No Prefix Users" },
            { name: "eval", usage: "eval <code>", description: "Evaluate JavaScript code" },
            { name: "shell", usage: "shell <command>", description: "Execute terminal commands" },
            { name: "servers", usage: "servers <list/leave/invite>", description: "Manage connected guilds" },
            { name: "blacklist", usage: "blacklist <user/server>", description: "Manage global blacklist" },
            { name: "reload", usage: "reload", description: "Reload the bot" },
            { name: "status", usage: "status", description: "View bot system status" }
        ]
    }
};
