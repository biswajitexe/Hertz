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
exports.command = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('botroles')
    .setDescription('Displays information about special bot roles');
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`<:74658vipglow:1465051133704798435> Bot Roles`)
            .setDescription(`**These are the special roles recognized within the Xeon ecosystem.**`)
            .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
            .addFields({
            name: `${config.emojis.owner} Owner`,
            value: "> The creator and absolute controller of the bot. Has access to all commands and bypasses all restrictions.",
            inline: false
        }, {
            name: `${config.emojis.admin} Admin`,
            value: "> Server Administrators who manage the bot's settings within the guild. Granted via Discord permissions.",
            inline: false
        }, {
            name: `${config.emojis.staff} Staff`,
            value: "> Special verified users who assist in bot moderation and support. Recognized globally across servers.",
            inline: false
        }, {
            name: `${config.emojis.noprefix} Premium User`,
            value: "> Supporters who have donated or boosted. They enjoy ad-free experience and premium profile aesthetics.",
            inline: false
        }, {
            name: `<:z_premium:1385210766457831434> No Prefix`,
            value: "> Users who can use commands without typing the prefix. Granted for testing or partnership.",
            inline: false
        }, {
            name: `${config.emojis.member || "👤"} Member`,
            value: "> Standard users of the bot. Can use all public commands.",
            inline: false
        })
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();
        yield interaction.reply({ embeds: [embed] });
    });
}
