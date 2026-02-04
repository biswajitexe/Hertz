"use strict";
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
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the bot\'s invite link');
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const inviteLink = interaction.client.generateInvite({
            scopes: [discord_js_1.OAuth2Scopes.Bot, discord_js_1.OAuth2Scopes.ApplicationsCommands],
            permissions: [
                discord_js_1.PermissionFlagsBits.Administrator
            ]
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle('Invite Me!')
            .setDescription(`[Click here to invite me to your server](${inviteLink})\n\nI need **Administrator** permissions for full functionality (Moderation, Antiraid, etc.).`)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
        yield interaction.reply({ embeds: [embed] });
    });
}
