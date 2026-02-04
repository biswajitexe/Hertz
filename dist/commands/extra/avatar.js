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
    .setName('avatar')
    .setDescription('Get a user\'s avatar')
    .addUserOption(option => option.setName('target')
    .setDescription('The user to get avatar for')
    .setRequired(false));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = interaction.options.getUser('target') || interaction.user;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ name: `${user.username}'s Avatar`, iconURL: user.displayAvatarURL() })
            .setImage(user.displayAvatarURL({ size: 4096 }))
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
        yield interaction.reply({ embeds: [embed] });
    });
}
