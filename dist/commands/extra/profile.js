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
    .setName('profile')
    .setDescription('View user profile with premium aesthetics')
    .addUserOption(option => option.setName('user').setDescription('The user to view').setRequired(false));
exports.aliases = ['pr'];
function getProfileData(interaction, targetUser, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const member = yield ((_a = interaction.guild) === null || _a === void 0 ? void 0 : _a.members.fetch({ user: targetUser.id, force: true }).catch(() => null));
        let userProfile = yield database.getUser(targetUser.id);
        const safeProfile = userProfile || {
            id: targetUser.id, bio: null, reps: 0, lastRepDate: 0, partnerId: null, marryDate: null, color: null
        };
        const botConfig = yield database.getBotConfig();
        const badgesList = [];
        if (targetUser.id === process.env.OWNER_ID || ((_b = botConfig.ownerUsers) === null || _b === void 0 ? void 0 : _b.includes(targetUser.id))) {
            badgesList.push(`${config.emojis.owner} **Owner**`);
        }
        if ((_c = botConfig.developerUsers) === null || _c === void 0 ? void 0 : _c.includes(targetUser.id)) {
            badgesList.push(`${config.emojis.developer} **Developer**`);
        }
        if ((_d = botConfig.adminUsers) === null || _d === void 0 ? void 0 : _d.includes(targetUser.id)) {
            badgesList.push(`${config.emojis.admin} **Admin**`);
        }
        if ((_e = botConfig.staffUsers) === null || _e === void 0 ? void 0 : _e.includes(targetUser.id)) {
            badgesList.push(`${config.emojis.staff} **Staff**`);
        }
        if ((_f = botConfig.vipUsers) === null || _f === void 0 ? void 0 : _f.includes(targetUser.id)) {
            badgesList.push(`${config.emojis.vip} **VIP**`);
        }
        if ((_g = botConfig.partnerUsers) === null || _g === void 0 ? void 0 : _g.includes(targetUser.id)) {
            badgesList.push(`${config.emojis.partner} **Partner**`);
        }
        if ((_h = botConfig.premiumUsers) === null || _h === void 0 ? void 0 : _h.includes(targetUser.id)) {
            badgesList.push(`${config.emojis.noprefix} **Premium User**`);
        }
        if ((_j = botConfig.noPrefixUsers) === null || _j === void 0 ? void 0 : _j.includes(targetUser.id)) {
            badgesList.push(`<:3852diamond:1466392074189410421> **No Prefix**`);
        }
        if ((_k = botConfig.supporterUsers) === null || _k === void 0 ? void 0 : _k.includes(targetUser.id)) {
            badgesList.push(`${config.emojis.supporter} **Supporter**`);
        }
        const badgesString = badgesList.length > 0 ? badgesList.join("\n> ") : "None";
        let statusText = "No status set.";
        if (member && member.presence) {
            const customStatus = member.presence.activities.find(act => act.type === 4);
            if (customStatus && customStatus.state)
                statusText = customStatus.state;
        }
        let activityStatus = "\n**Activity**\n> Not listening to Spotify.";
        let activityImage = null;
        let activityUrl = null;
        if (member && member.presence) {
            const activities = member.presence.activities;
            const spotify = activities.find(act => act.name === 'Spotify' || act.type === discord_js_1.ActivityType.Listening);
            if (spotify) {
                const trackName = spotify.details;
                const artist = spotify.state;
                const album = (_l = spotify.assets) === null || _l === void 0 ? void 0 : _l.largeText;
                activityImage = (_m = spotify.assets) === null || _m === void 0 ? void 0 : _m.largeImageURL();
                activityUrl = `https://open.spotify.com/search/${encodeURIComponent(trackName + " " + artist)}`;
                activityStatus = `\n**<:35248spotify:1466417623842689100> Spotify**\n> **Song:** ${trackName}\n> **Artist:** ${artist}\n> **Album:** ${album || "Unknown"}`;
            }
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(safeProfile.color || config.colors.primary)
            .setAuthor({ name: `${targetUser.username}'s Profile`, iconURL: targetUser.displayAvatarURL() })
            .setThumbnail(activityImage || targetUser.displayAvatarURL({ size: 1024 }))
            .setDescription(`**Badges**\n> ${badgesString}\n\n` +
            `**Status**\n> ${statusText}\n` +
            `${activityStatus}`)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder();
        const avatarBtn = new discord_js_1.ButtonBuilder().setLabel('Avatar').setStyle(discord_js_1.ButtonStyle.Link).setURL(targetUser.displayAvatarURL({ size: 1024 }));
        row.addComponents(avatarBtn);
        const fetchedUser = yield targetUser.fetch();
        if (fetchedUser.bannerURL()) {
            const bannerBtn = new discord_js_1.ButtonBuilder().setLabel('Banner').setStyle(discord_js_1.ButtonStyle.Link).setURL(fetchedUser.bannerURL({ size: 1024 }));
            row.addComponents(bannerBtn);
        }
        if (activityUrl) {
            const activityBtn = new discord_js_1.ButtonBuilder().setLabel(activityUrl.includes('spotify') ? 'Play on Spotify' : 'View Activity').setStyle(discord_js_1.ButtonStyle.Link).setURL(activityUrl);
            row.addComponents(activityBtn);
        }
        return { embed, row };
    });
}
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.inCachedGuild())
            return;
        yield interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const { embed, row } = yield getProfileData(interaction, targetUser, database);
        yield interaction.editReply({ embeds: [embed], components: [row] });
        const interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const newData = yield getProfileData(interaction, targetUser, database);
                yield interaction.editReply({ embeds: [newData.embed], components: [newData.row] });
            }
            catch (e) {
                clearInterval(interval);
            }
        }), 5000);
        setTimeout(() => {
            clearInterval(interval);
        }, 60000);
    });
}
