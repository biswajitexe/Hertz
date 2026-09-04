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
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Display detailed information about a user')
    .addUserOption(option => option.setName('target')
    .setDescription('The user to get info for')
    .setRequired(false));
exports.aliases = ["ui"];
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const rawUser = interaction.options.getUser('target') || interaction.user;
        const user = yield interaction.client.users.fetch(rawUser.id, { force: true });
        const member = (_a = interaction.guild) === null || _a === void 0 ? void 0 : _a.members.cache.get(user.id);
        const targetMember = member || (interaction.guild ? yield interaction.guild.members.fetch(user.id).catch(() => null) : null);
        const embed = new componentV2_1.V2Embed()
            .setColor(config.colors.default)
            .setTitle(`User Info: ${user.username}`)
            .setThumbnail(user.displayAvatarURL({ size: 4096 }))
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        const userInfoParts = [
            `${config.emojis.dot} **Display Name:** ${user.globalName || user.username}`,
            `${config.emojis.dot} **Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            `${config.emojis.dot} **Bot:** ${user.bot ? config.emojis.success : config.emojis.error}`,
        ];
        embed.addFields({
            name: `${config.emojis.user || "👤"} User Details`,
            value: userInfoParts.join("\n"),
            inline: false
        });
        if (targetMember) {
            const roles = targetMember.roles.cache
                .filter(r => r.id !== interaction.guildId)
                .sort((a, b) => b.position - a.position);
            const roleString = roles.size > 0
                ? roles.map(r => r.toString()).slice(0, 5).join(", ") + (roles.size > 5 ? ` +${roles.size - 5} more` : "")
                : "No roles";
            const acknowledgements = [];
            if (targetMember.permissions.has(discord_js_1.PermissionFlagsBits.Administrator))
                acknowledgements.push("Administrator");
            else if (targetMember.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild))
                acknowledgements.push("Server Manager");
            else if (targetMember.permissions.has(discord_js_1.PermissionFlagsBits.ManageMessages))
                acknowledgements.push("Moderator");
            if (((_b = interaction.guild) === null || _b === void 0 ? void 0 : _b.ownerId) === user.id)
                acknowledgements.unshift("Server Owner 👑");
            const boosterStatus = targetMember.premiumSince
                ? `${config.emojis.success} <t:${Math.floor(targetMember.premiumSinceTimestamp / 1000)}:R>`
                : `${config.emojis.error}`;
            embed.addFields({
                name: `${config.emojis.member || "🛡️"} Member Details`,
                value: [
                    `${config.emojis.dot} **Joined:** <t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`,
                    `${config.emojis.dot} **Nickname:** ${targetMember.nickname || "None"}`,
                    `${config.emojis.dot} **Highest Role:** ${targetMember.roles.highest.id === interaction.guildId ? "None" : targetMember.roles.highest}`,
                    `${config.emojis.dot} **Booster:** ${boosterStatus}`,
                    `${config.emojis.dot} **Permissions:** ${acknowledgements.length > 0 ? acknowledgements.join(", ") : "Regular Member"}`,
                ].join("\n"),
                inline: false
            });
        }
        else {
            embed.addFields({
                name: "Note",
                value: `${config.emojis.warning} User is not in this server.`,
                inline: false
            });
        }
        if (user.bannerURL()) {
            embed.setImage(user.bannerURL({ size: 4096 }));
        }
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setLabel('Avatar')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(user.displayAvatarURL({ size: 4096 })));
        if (user.bannerURL()) {
            row.addComponents(new discord_js_1.ButtonBuilder()
                .setLabel('Banner')
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(user.bannerURL({ size: 4096 })));
        }
        yield interaction.reply(embed.toPayload({ extraComponents: [row] }));
    });
}
