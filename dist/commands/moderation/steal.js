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
const embedUtils_1 = require("../../utilities/embedUtils");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('steal')
    .setDescription('Steal emoji(s) from another server (args or reply).')
    .addStringOption(option => option.setName('emoji')
    .setDescription('The emoji(s) to steal (custom emoji or URL).')
    .setRequired(false))
    .addStringOption(option => option.setName('name')
    .setDescription('Name for the new emoji (ignored if multiple emojis).')
    .setRequired(false))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageEmojisAndStickers);
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageEmojisAndStickers)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You do not have permission to manage emojis.**")], ephemeral: true });
        }
        let rawInput = interaction.options.getString('emoji', false);
        let name = interaction.options.getString('name', false);
        if (!rawInput) {
            const msg = interaction.message;
            if (msg && msg.reference && msg.reference.messageId) {
                try {
                    const referencedMsg = yield msg.channel.messages.fetch(msg.reference.messageId);
                    if (referencedMsg && referencedMsg.content) {
                        rawInput = referencedMsg.content;
                    }
                }
                catch (e) { }
            }
        }
        const emojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/g;
        if (!rawInput) {
            if (name && emojiRegex.test(name)) {
                rawInput = name;
                name = null;
            }
            else {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setThumbnail(interaction.client.user.displayAvatarURL())
                    .setDescription(`\`?steal <emoji(s)>\`\n\`?steal <emoji> <name>\`\nor **Reply** with \`?steal\``)
                    .setFooter({ text: `Xeon • Advanced Moderation`, iconURL: interaction.client.user.displayAvatarURL() });
                return interaction.reply({ embeds: [embed] });
            }
        }
        const matches = Array.from(rawInput.matchAll(emojiRegex));
        if (matches.length === 0 && name) {
            const nameMatches = Array.from(name.matchAll(emojiRegex));
            if (nameMatches.length > 0) {
                rawInput = name;
                name = null;
                matches.push(...nameMatches);
            }
        }
        const idRegex = /(\d{17,19})/g;
        if (matches.length === 0) {
            const idMatches = Array.from(rawInput.matchAll(idRegex));
            if (idMatches.length > 0) {
                for (const m of idMatches) {
                    const id = m[1];
                    let animated = false;
                    let extractedName = `emoji_${id}`;
                    try {
                        const fetched = interaction.client.emojis.cache.get(id);
                        if (fetched) {
                            animated = fetched.animated || false;
                            extractedName = fetched.name || extractedName;
                        }
                    }
                    catch (e) { }
                    matches.push([
                        `<:${extractedName}:${id}>`,
                        animated ? 'a' : undefined,
                        extractedName,
                        id
                    ]);
                }
            }
        }
        if (matches.length === 0) {
            if (rawInput.startsWith('http')) {
                yield handleSingleInternal(interaction, rawInput, name || "stolen_emoji");
                return;
            }
            return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**No emojis found.**")] });
        }
        if (matches.length > 20) {
            return interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**Too many emojis! Maximum 20 at a time.**")] });
        }
        yield interaction.deferReply();
        const added = [];
        const failed = [];
        const existing = [];
        for (const match of matches) {
            const animated = match[1] === 'a';
            const extractedName = match[2];
            const id = match[3];
            const type = animated ? 'gif' : 'png';
            const url = `https://cdn.discordapp.com/emojis/${id}.${type}`;
            const targetName = (matches.length === 1 && name) ? name : extractedName;
            const alreadyExists = interaction.guild.emojis.cache.find(e => e.name === targetName);
            if (alreadyExists) {
                existing.push(targetName);
                continue;
            }
            try {
                const emoji = yield interaction.guild.emojis.create({ attachment: url, name: targetName });
                added.push(emoji.toString());
            }
            catch (e) {
                failed.push(extractedName);
            }
        }
        if (added.length === 0 && failed.length > 0) {
            return interaction.editReply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, `**Failed to add emojis.**\nLikely reasons: File size, Slots full, or invalid format.`)] });
        }
        const joinLimit = (arr, limit = 5) => {
            if (arr.length <= limit)
                return arr.join(', ');
            return `${arr.slice(0, limit).join(', ')} (+${arr.length - limit} more)`;
        };
        let description = "";
        if (added.length > 0)
            description += `${config.emojis.success} **Added:** ${joinLimit(added)}\n`;
        if (existing.length > 0)
            description += `${config.emojis.warning} **Skipped (Exist):** ${joinLimit(existing)}\n`;
        if (failed.length > 0)
            description += `${config.emojis.error} **Failed:** ${joinLimit(failed)}`;
        if (!description)
            description = "No emojis added (Duplicates skipped).";
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(description);
        yield interaction.editReply({ embeds: [embed] });
    });
}
function handleSingleInternal(interaction, url, name) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield interaction.deferReply();
            const emoji = yield interaction.guild.emojis.create({ attachment: url, name: name });
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.success)
                .setDescription(`${config.emojis.success} **Added:** ${emoji} \`${name}\``);
            yield interaction.editReply({ embeds: [embed] });
        }
        catch (err) {
            let errorMsg = "Failed to add emoji.";
            if (err.code === 30008)
                errorMsg = "Maximum number of emojis reached.";
            if (err.code === 50035)
                errorMsg = "Invalid form body.";
            yield interaction.editReply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, `**${errorMsg}**`)] });
        }
    });
}
