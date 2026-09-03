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
exports.handleInteraction = exports.run = exports.command = void 0;
const discord_js_1 = require("discord.js");
const google_translate_api_x_1 = require("google-translate-api-x");
const config_1 = require("../../config");
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName("translate")
    .setDescription("Translate text to another language")
    .addStringOption(option => option.setName("text")
    .setDescription("The text to translate")
    .setRequired(true))
    .addStringOption(option => option.setName("to")
    .setDescription("Target language (e.g. hi, en, es)")
    .setRequired(false));
const INDIAN_LANGUAGES = [
    { label: "Hindi (हिंदी)", value: "hi", emoji: "🇮🇳" },
    { label: "Bengali (বাংলা)", value: "bn", emoji: "🇮🇳" },
    { label: "Marathi (मराठी)", value: "mr", emoji: "🇮🇳" },
    { label: "Telugu (తెలుగు)", value: "te", emoji: "🇮🇳" },
    { label: "Tamil (தமிழ்)", value: "ta", emoji: "🇮🇳" },
    { label: "Gujarati (ગુજરાતી)", value: "gu", emoji: "🇮🇳" },
    { label: "Urdu (اردو)", value: "ur", emoji: "🇮🇳" },
    { label: "Kannada (ಕನ್ನಡ)", value: "kn", emoji: "🇮🇳" },
    { label: "Malayalam (മലയാളം)", value: "ml", emoji: "🇮🇳" },
    { label: "Punjabi (ਪੰਜਾਬੀ)", value: "pa", emoji: "🇮🇳" }
];
const GLOBAL_LANGUAGES = [
    { label: "English", value: "en", emoji: "🇺🇸" },
    { label: "Spanish", value: "es", emoji: "🇪🇸" },
    { label: "French", value: "fr", emoji: "🇫🇷" },
    { label: "German", value: "de", emoji: "🇩🇪" },
    { label: "Russian", value: "ru", emoji: "🇷🇺" },
    { label: "Japanese", value: "ja", emoji: "🇯🇵" },
    { label: "Korean", value: "ko", emoji: "🇰🇷" },
    { label: "Chinese (Simplified)", value: "zh-CN", emoji: "🇨🇳" }
];
const run = (interaction, database) => __awaiter(void 0, void 0, void 0, function* () {
    let textToTranslate = "";
    let targetLang = "en";
    let isReply = false;
    let replyMessage = null;
    if (!(interaction instanceof discord_js_1.CommandInteraction)) {
        const message = interaction;
        if (message.reference && message.reference.messageId) {
            try {
                replyMessage = yield message.channel.messages.fetch(message.reference.messageId);
                if (replyMessage && replyMessage.content) {
                    textToTranslate = replyMessage.content;
                    isReply = true;
                }
            }
            catch (e) {
            }
        }
        if (!textToTranslate) {
            const args = message.content.split(" ").slice(1);
            if (args.length > 0) {
                if (args[0].length === 2 && args.length > 1) {
                    targetLang = args[0];
                    textToTranslate = args.slice(1).join(" ");
                }
                else {
                    textToTranslate = args.join(" ");
                }
            }
        }
    }
    else {
        if (interaction.isChatInputCommand()) {
            textToTranslate = interaction.options.getString("text", true);
            targetLang = interaction.options.getString("to") || "en";
        }
    }
    let contentToCheck = "";
    if (interaction instanceof discord_js_1.Message) {
        contentToCheck = interaction.content;
    }
    if (isReply && interaction instanceof discord_js_1.Message && !contentToCheck.split(" ").slice(1).length) {
        return sendLanguageDropdown(interaction, textToTranslate);
    }
    if (!textToTranslate) {
        const err = (0, componentV2_1.createErrorV2)("Please provide text to translate or reply to a message!");
        if (interaction instanceof discord_js_1.Message)
            return interaction.reply(err.toPayload());
        return interaction.reply(err.toPayload({ ephemeral: true }));
    }
    yield performTranslation(interaction, textToTranslate, targetLang);
});
exports.run = run;
function sendLanguageDropdown(interaction, text) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`translate_select_${((_a = interaction.author) === null || _a === void 0 ? void 0 : _a.id) || ((_b = interaction.user) === null || _b === void 0 ? void 0 : _b.id)}`)
            .setPlaceholder("Select a Language (Indian Languages prioritized)")
            .addOptions(...INDIAN_LANGUAGES.map(l => new discord_js_1.StringSelectMenuOptionBuilder().setLabel(l.label).setValue(l.value).setEmoji(l.emoji)), ...GLOBAL_LANGUAGES.map(l => new discord_js_1.StringSelectMenuOptionBuilder().setLabel(l.label).setValue(l.value).setEmoji(l.emoji)));
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        const embed = new componentV2_1.V2Embed()
            .setColor(config_1.colors.primary)
            .setTitle("Language Selection")
            .setDescription(`**Select a language to translate the text:**\n> ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
        if (interaction instanceof discord_js_1.Message) {
            const msg = yield interaction.reply(embed.toPayload({ extraComponents: [row] }));
            const targetId = (_c = interaction.reference) === null || _c === void 0 ? void 0 : _c.messageId;
            if (targetId) {
                const newMenu = new discord_js_1.StringSelectMenuBuilder(selectMenu.toJSON())
                    .setCustomId(`translate_sel_${interaction.author.id}_${targetId}`);
                const newRow = new discord_js_1.ActionRowBuilder().addComponents(newMenu);
                yield msg.edit(embed.toPayload({ extraComponents: [newRow] }));
            }
        }
        else {
            yield interaction.reply(embed.toPayload({ extraComponents: [row], ephemeral: true }));
        }
    });
}
function performTranslation(interaction, text, targetLang) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        let replyMsg;
        if (interaction instanceof discord_js_1.Message) {
            replyMsg = yield interaction.reply({ content: `${config_1.emojis.loading || '⏳'} Translating...` });
        }
        else if (interaction.isRepliable && interaction.isRepliable()) {
            yield interaction.deferReply();
        }
        try {
            const res = yield (0, google_translate_api_x_1.translate)(text, { to: targetLang });
            const embed = new componentV2_1.V2Embed()
                .setColor(0x4285F4)
                .setAuthor("Translation Result", "https://upload.wikimedia.org/wikipedia/commons/d/db/Google_Translate_Icon.png")
                .addFields({ name: `Original (${((_b = (_a = res.from) === null || _a === void 0 ? void 0 : _a.language) === null || _b === void 0 ? void 0 : _b.iso) || 'auto'})`, value: `> ${text.substring(0, 1000)}` }, { name: `Translated (${targetLang})`, value: `> ${res.text.substring(0, 1000)}` })
                .setFooter(`Requested by ${((_d = (_c = interaction.member) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.username) || ((_e = interaction.author) === null || _e === void 0 ? void 0 : _e.username)}`);
            if (interaction instanceof discord_js_1.Message) {
                yield replyMsg.edit(Object.assign({ content: null }, embed.toPayload()));
            }
            else {
                yield interaction.editReply(embed.toPayload());
            }
        }
        catch (e) {
            console.error(e);
            const errEmbed = (0, componentV2_1.createErrorV2)("Failed to translate. Please check the language code.");
            if (interaction instanceof discord_js_1.Message) {
                yield replyMsg.edit(Object.assign({ content: null }, errEmbed.toPayload()));
            }
            else {
                yield interaction.editReply(errEmbed.toPayload());
            }
        }
    });
}
const handleInteraction = (interaction, database) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!interaction.isStringSelectMenu())
        return;
    const parts = interaction.customId.split("_");
    if (parts[0] !== "translate" || parts[1] !== "sel")
        return;
    const ownerId = parts[2];
    const targetMsgId = parts[3];
    if (interaction.user.id !== ownerId) {
        return interaction.reply((0, componentV2_1.createErrorV2)("This menu is not for you!").toPayload({ ephemeral: true }));
    }
    const selectedLang = interaction.values[0];
    yield interaction.deferUpdate();
    try {
        const targetMsg = yield interaction.channel.messages.fetch(targetMsgId);
        if (!targetMsg) {
            return interaction.followUp((0, componentV2_1.createErrorV2)("Original message not found.").toPayload({ ephemeral: true }));
        }
        const text = targetMsg.content;
        const res = yield (0, google_translate_api_x_1.translate)(text, { to: selectedLang });
        const embed = new componentV2_1.V2Embed()
            .setColor(0x4285F4)
            .setAuthor("Translation Result", "https://upload.wikimedia.org/wikipedia/commons/d/db/Google_Translate_Icon.png")
            .addFields({ name: `Original (${((_b = (_a = res.from) === null || _a === void 0 ? void 0 : _a.language) === null || _b === void 0 ? void 0 : _b.iso) || 'auto'})`, value: `> ${text.substring(0, 1000)}` }, { name: `Translated (${selectedLang})`, value: `> ${res.text.substring(0, 1000)}` })
            .setFooter(`Requested by ${interaction.user.username}`);
        yield interaction.editReply(Object.assign({ content: null }, embed.toPayload()));
    }
    catch (e) {
        console.error(e);
        yield interaction.followUp((0, componentV2_1.createErrorV2)("Translation failed.").toPayload({ ephemeral: true }));
    }
});
exports.handleInteraction = handleInteraction;
