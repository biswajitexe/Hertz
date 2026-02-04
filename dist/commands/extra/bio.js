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
    .setName('bio')
    .setDescription('Manage your profile bio.')
    .addSubcommand(sub => sub.setName('set')
    .setDescription('Set your bio')
    .addStringOption(option => option.setName('text').setDescription('The bio text (max 200 chars)').setRequired(true).setMaxLength(200)))
    .addSubcommand(sub => sub.setName('view')
    .setDescription('View a user\'s bio')
    .addUserOption(option => option.setName('user').setDescription('The user to view')));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const sub = interaction.options.getSubcommand();
        if (sub === 'set') {
            const text = interaction.options.getString('text', true);
            const userProfile = yield database.getUser(interaction.user.id);
            userProfile.bio = text;
            yield database.updateUser(userProfile);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription(`${config.emojis.success} **Bio Updated!**\n\n> ${text}`)
                .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (sub === 'view') {
            const target = interaction.options.getUser('user') || interaction.user;
            const userProfile = yield database.getUser(target.id);
            const bio = userProfile.bio || "No bio set.";
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: `${target.username}'s Bio`, iconURL: target.displayAvatarURL() })
                .setDescription(`> ${bio}`)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            return interaction.reply({ embeds: [embed] });
        }
    });
}
