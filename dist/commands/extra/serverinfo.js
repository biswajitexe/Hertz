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
exports.aliases = exports.command = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display detailed server information with categorized pages');
exports.aliases = ["si", "server"];
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.guild)
            return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        const guild = interaction.guild;
        const owner = yield guild.fetchOwner().catch(() => null);
        const generateEmbed = (page) => {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: guild.name, iconURL: guild.iconURL() || undefined })
                .setThumbnail(guild.iconURL({ size: 4096 }))
                .setFooter({ text: `Requested by ${interaction.user.tag} • Page: ${page}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            if (guild.bannerURL())
                embed.setImage(guild.bannerURL({ size: 4096 }));
            switch (page) {
                case 'General':
                    const verificationMap = {
                        [discord_js_1.GuildVerificationLevel.None]: "None",
                        [discord_js_1.GuildVerificationLevel.Low]: "Low",
                        [discord_js_1.GuildVerificationLevel.Medium]: "Medium",
                        [discord_js_1.GuildVerificationLevel.High]: "High",
                        [discord_js_1.GuildVerificationLevel.VeryHigh]: "Highest"
                    };
                    const mfaMap = {
                        [discord_js_1.GuildMFALevel.None]: "None",
                        [discord_js_1.GuildMFALevel.Elevated]: "Elevated (2FA Required)"
                    };
                    const explicitMap = {
                        [discord_js_1.GuildExplicitContentFilter.Disabled]: "Disabled",
                        [discord_js_1.GuildExplicitContentFilter.MembersWithoutRoles]: "Members without Roles",
                        [discord_js_1.GuildExplicitContentFilter.AllMembers]: "All Members"
                    };
                    embed.setTitle("<:iconfolder:1458160174815514670> Server Profile")
                        .addFields({
                        name: "Identity",
                        value: [
                            `${config.emojis.dot} **Name:** ${guild.name}`,
                            `${config.emojis.dot} **ID:** \`${guild.id}\``,
                            `${config.emojis.dot} **Owner:** ${owner ? `${owner.user} (\`${owner.user.tag}\`)` : "Unknown"}`,
                            `${config.emojis.dot} **Description:** ${guild.description || "None"}`
                        ].join("\n"),
                        inline: false
                    }, {
                        name: "Server Configuration",
                        value: [
                            `${config.emojis.dot} **Preferred Locale:** ${guild.preferredLocale}`,
                            `${config.emojis.dot} **System Channel:** ${guild.systemChannel ? guild.systemChannel.toString() : "None"}`,
                            `${config.emojis.dot} **Rules Channel:** ${guild.rulesChannel ? guild.rulesChannel.toString() : "None"}`,
                            `${config.emojis.dot} **AFK Channel:** ${guild.afkChannel ? `${guild.afkChannel.toString()} (${guild.afkTimeout / 60} min)` : "None"}`
                        ].join("\n"),
                        inline: false
                    }, {
                        name: "Security & Safety",
                        value: [
                            `${config.emojis.dot} **Verification:** ${verificationMap[guild.verificationLevel]}`,
                            `${config.emojis.dot} **Explicit Filter:** ${explicitMap[guild.explicitContentFilter]}`,
                            `${config.emojis.dot} **2FA Requirement:** ${mfaMap[guild.mfaLevel]}`,
                            `${config.emojis.dot} **Notifications:** ${guild.defaultMessageNotifications === 0 ? "All Messages" : "Only Mentions"}`
                        ].join("\n"),
                        inline: false
                    }, {
                        name: "Timeline",
                        value: [
                            `${config.emojis.dot} **Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                            `${config.emojis.dot} **Relative:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
                        ].join("\n"),
                        inline: false
                    });
                    break;
                case 'Members':
                    const total = guild.memberCount;
                    const humans = guild.members.cache.filter(m => !m.user.bot).size;
                    const bots = guild.members.cache.filter(m => m.user.bot).size;
                    const online = guild.members.cache.filter(m => { var _a; return ((_a = m.presence) === null || _a === void 0 ? void 0 : _a.status) === 'online'; }).size;
                    const idle = guild.members.cache.filter(m => { var _a; return ((_a = m.presence) === null || _a === void 0 ? void 0 : _a.status) === 'idle'; }).size;
                    const dnd = guild.members.cache.filter(m => { var _a; return ((_a = m.presence) === null || _a === void 0 ? void 0 : _a.status) === 'dnd'; }).size;
                    const offline = total - (online + idle + dnd);
                    let maxUpload = "25MB";
                    if (guild.premiumTier === discord_js_1.GuildPremiumTier.Tier2)
                        maxUpload = "50MB";
                    if (guild.premiumTier === discord_js_1.GuildPremiumTier.Tier3)
                        maxUpload = "100MB";
                    embed.setTitle("<:Member1:1459604921451020472> Members & Stats")
                        .addFields({
                        name: "Member Counts",
                        value: [
                            `${config.emojis.dot} **Total Members:** ${total.toLocaleString()}`,
                            `${config.emojis.dot} **Humans:** ${humans.toLocaleString()}`,
                            `${config.emojis.dot} **Bots:** ${bots.toLocaleString()}`
                        ].join("\n"),
                        inline: false
                    }, {
                        name: "Boost Status",
                        value: [
                            `${config.emojis.dot} **Level:** Tier ${guild.premiumTier}`,
                            `${config.emojis.dot} **Count:** ${guild.premiumSubscriptionCount || 0} Boosts`
                        ].join("\n"),
                        inline: false
                    }, {
                        name: "Server Limits (Premium)",
                        value: [
                            `${config.emojis.dot} **Max Upload:** ${maxUpload}`,
                            `${config.emojis.dot} **Max Emoji Slots:** ${getEmojiLimit(guild.premiumTier)}`,
                            `${config.emojis.dot} **Max Sticker Slots:** ${getStickerLimit(guild.premiumTier)}`,
                            `${config.emojis.dot} **Video Quality:** ${guild.premiumTier >= discord_js_1.GuildPremiumTier.Tier1 ? "720p/60fps" : "Standard"}`
                        ].join("\n"),
                        inline: false
                    });
                    break;
                case 'Channels':
                    const channels = guild.channels.cache;
                    const text = channels.filter(c => c.type === discord_js_1.ChannelType.GuildText).size;
                    const voice = channels.filter(c => c.type === discord_js_1.ChannelType.GuildVoice).size;
                    const categories = channels.filter(c => c.type === discord_js_1.ChannelType.GuildCategory).size;
                    const news = channels.filter(c => c.type === discord_js_1.ChannelType.GuildAnnouncement).size;
                    const stage = channels.filter(c => c.type === discord_js_1.ChannelType.GuildStageVoice).size;
                    const forum = channels.filter(c => c.type === discord_js_1.ChannelType.GuildForum).size;
                    const roleCount = guild.roles.cache.size;
                    const highestRole = guild.roles.highest;
                    const topRoles = guild.roles.cache
                        .filter(r => r.id !== guild.id)
                        .sort((a, b) => b.position - a.position)
                        .first(10)
                        .map(r => r.toString())
                        .join(", ");
                    const emojis = guild.emojis.cache;
                    const emojiPreview = emojis.size > 0
                        ? emojis.first(15).map(e => e.toString()).join(" ") + (emojis.size > 15 ? ` ...+${emojis.size - 15}` : "")
                        : "No Emojis";
                    embed.setTitle("<:channel48:1459829078881468570> Channels & Assets")
                        .addFields({
                        name: "Channel Distribution",
                        value: [
                            `${config.emojis.dot} **Total:** ${channels.size}`,
                            `${config.emojis.dot} **Text:** ${text} | **Voice:** ${voice}`,
                            `${config.emojis.dot} **Categories:** ${categories} | **News:** ${news}`,
                            `${config.emojis.dot} **Stage:** ${stage} | **Forum:** ${forum}`
                        ].join("\n"),
                        inline: false
                    }, {
                        name: `Roles (${roleCount})`,
                        value: `**Highest:** ${highestRole}\n**Top Roles:** ${topRoles || "None"}`,
                        inline: false
                    }, {
                        name: `Emojis (${emojis.size}) & Stickers (${guild.stickers.cache.size})`,
                        value: emojiPreview,
                        inline: false
                    });
                    break;
                case 'Features':
                    const featuresList = guild.features.map(f => `\`${f.replace(/_/g, ' ')}\``).join(", ") || "None";
                    const shortFeatures = featuresList.length > 1024 ? featuresList.substring(0, 1020) + "..." : featuresList;
                    embed.setTitle("<:carpeunlock:1458160337789518051> Features & Extras")
                        .addFields({
                        name: "Vanity & Links",
                        value: [
                            `${config.emojis.dot} **Vanity URL:** ${guild.vanityURLCode ? `gg/${guild.vanityURLCode}` : "None"}`,
                            `${config.emojis.dot} **Banner:** ${guild.banner ? "Set" : "None"}`,
                            `${config.emojis.dot} **Splash:** ${guild.splash ? "Set" : "None"}`,
                            `${config.emojis.dot} **Discovery:** ${guild.features.includes(discord_js_1.GuildFeature.Discoverable) ? "Enabled" : "Disabled"}`
                        ].join("\n"),
                        inline: false
                    }, {
                        name: "Guild Features",
                        value: shortFeatures,
                        inline: false
                    });
                    break;
            }
            return embed;
        };
        const getButtons = (currentPage, disabled = false) => {
            const row1 = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('si_gen').setLabel('General').setStyle(currentPage === 'General' ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary).setEmoji('1458160174815514670').setDisabled(disabled), new discord_js_1.ButtonBuilder().setCustomId('si_mem').setLabel('Members').setStyle(currentPage === 'Members' ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary).setEmoji('1459604921451020472').setDisabled(disabled), new discord_js_1.ButtonBuilder().setCustomId('si_chn').setLabel('Channels').setStyle(currentPage === 'Channels' ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary).setEmoji('1459829078881468570').setDisabled(disabled), new discord_js_1.ButtonBuilder().setCustomId('si_feat').setLabel('Features').setStyle(currentPage === 'Features' ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary).setEmoji('1458160337789518051').setDisabled(disabled));
            const row2 = new discord_js_1.ActionRowBuilder();
            if (guild.iconURL())
                row2.addComponents(new discord_js_1.ButtonBuilder().setLabel('Icon').setStyle(discord_js_1.ButtonStyle.Link).setURL(guild.iconURL({ size: 4096 })));
            if (guild.bannerURL())
                row2.addComponents(new discord_js_1.ButtonBuilder().setLabel('Banner').setStyle(discord_js_1.ButtonStyle.Link).setURL(guild.bannerURL({ size: 4096 })));
            if (guild.splashURL())
                row2.addComponents(new discord_js_1.ButtonBuilder().setLabel('Splash').setStyle(discord_js_1.ButtonStyle.Link).setURL(guild.splashURL({ size: 4096 })));
            return row2.components.length > 0 ? [row1, row2] : [row1];
        };
        const message = yield interaction.reply({
            embeds: [generateEmbed('General')],
            components: getButtons('General'),
            fetchReply: true
        });
        const collector = message.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            time: 60000
        });
        collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
            if (i.user.id !== interaction.user.id) {
                yield i.reply({ content: `${config.emojis.error} You cannot interact with this menu.`, ephemeral: true });
                return;
            }
            let pageName = 'General';
            if (i.customId === 'si_gen')
                pageName = 'General';
            if (i.customId === 'si_mem')
                pageName = 'Members';
            if (i.customId === 'si_chn')
                pageName = 'Channels';
            if (i.customId === 'si_feat')
                pageName = 'Features';
            yield i.update({
                embeds: [generateEmbed(pageName)],
                components: getButtons(pageName)
            });
        }));
        collector.on('end', () => __awaiter(this, void 0, void 0, function* () {
            yield interaction.editReply({ components: getButtons('General', true) }).catch(() => { });
        }));
    });
}
function getNextTierGoal(currentTier) {
    if (currentTier === discord_js_1.GuildPremiumTier.None)
        return 2;
    if (currentTier === discord_js_1.GuildPremiumTier.Tier1)
        return 7;
    if (currentTier === discord_js_1.GuildPremiumTier.Tier2)
        return 14;
    return 14;
}
function getProgressBar(current, goal) {
    const percent = Math.min(current / goal, 1);
    const filled = Math.round(percent * 10);
    const empty = 10 - filled;
    return "[" + "🟦".repeat(filled) + "⬜".repeat(empty) + `] ${current}/${goal}`;
}
function getEmojiLimit(tier) {
    if (tier === discord_js_1.GuildPremiumTier.Tier1)
        return "100";
    if (tier === discord_js_1.GuildPremiumTier.Tier2)
        return "150";
    if (tier === discord_js_1.GuildPremiumTier.Tier3)
        return "250";
    return "50";
}
function getStickerLimit(tier) {
    if (tier === discord_js_1.GuildPremiumTier.Tier1)
        return "15";
    if (tier === discord_js_1.GuildPremiumTier.Tier2)
        return "30";
    if (tier === discord_js_1.GuildPremiumTier.Tier3)
        return "60";
    return "5";
}
