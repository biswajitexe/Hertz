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
exports.run = exports.command = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName("large")
    .setDescription("Enlarge a custom emoji")
    .addStringOption(option => option.setName("emoji")
    .setDescription("The emoji to enlarge")
    .setRequired(true));
const run = (interaction, database) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let emojiArg = "";
    if (interaction instanceof discord_js_1.CommandInteraction) {
        emojiArg = (_a = interaction.options.get("emoji")) === null || _a === void 0 ? void 0 : _a.value;
    }
    else if (interaction instanceof discord_js_1.Message) {
        const args = interaction.content.split(" ").slice(1);
        emojiArg = args[0] || "";
        if (!emojiArg && interaction.reference && interaction.reference.messageId) {
            try {
                const replyMessage = yield interaction.channel.messages.fetch(interaction.reference.messageId);
                if (replyMessage && replyMessage.content) {
                    const customEmojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
                    const match = replyMessage.content.match(customEmojiRegex);
                    if (match) {
                        emojiArg = match[0];
                    }
                }
            }
            catch (e) {
            }
        }
    }
    if (!emojiArg) {
        const msg = `${config_1.emojis.error} Please provide an emoji or reply to a message with an emoji! Usage: \`/large <emoji>\` or \`?large <emoji>\``;
        if (interaction instanceof discord_js_1.Message)
            return interaction.reply(msg);
        return interaction.reply({ content: msg, ephemeral: true });
    }
    const customEmojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
    const match = emojiArg.match(customEmojiRegex);
    if (!match) {
        const msg = `${config_1.emojis.error} I can only enlarge **Custom Server Emojis**. Unicode emojis (like 😂) are not supported yet.`;
        if (interaction instanceof discord_js_1.Message)
            return interaction.reply(msg);
        return interaction.reply({ content: msg, ephemeral: true });
    }
    const isAnimated = match[1] === "a";
    const name = match[2];
    const id = match[3];
    const extension = isAnimated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${id}.${extension}?size=4096`;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(config_1.colors.primary)
        .setTitle(`Enlarged Emoji: ${name}`)
        .setImage(url)
        .setFooter({ text: `ID: ${id}` });
    if (interaction instanceof discord_js_1.Message) {
        return interaction.reply({ embeds: [embed] });
    }
    else {
        return interaction.reply({ embeds: [embed] });
    }
});
exports.run = run;
