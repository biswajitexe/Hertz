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
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('sticker')
    .setDescription('Steal a sticker (from attachment or URL)')
    .addAttachmentOption(option => option.setName('file')
    .setDescription('The sticker file (PNG/GIF)')
    .setRequired(true))
    .addStringOption(option => option.setName('name')
    .setDescription('Name for the new sticker')
    .setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageEmojisAndStickers);
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageEmojisAndStickers)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply((0, embedUtils_1.createErrorEmbed)(interaction.user, "**You do not have permission to manage stickers.**").toPayload({ ephemeral: true }));
        }
        const attachmentOption = interaction.options.getAttachment('file', false);
        let name = interaction.options.getString('name', false);
        let attachment = attachmentOption;
        if (!attachment) {
            const msg = interaction.message;
            if (msg && msg.reference && msg.reference.messageId) {
                try {
                    const referencedMsg = yield msg.channel.messages.fetch(msg.reference.messageId);
                    if (referencedMsg) {
                        if (referencedMsg.stickers.size > 0) {
                            const stickerItem = referencedMsg.stickers.first();
                            if (stickerItem.format === 1 || stickerItem.format === 2 || stickerItem.format === 4) {
                                attachment = { url: stickerItem.url, contentType: 'image/png' };
                                if (!name)
                                    name = stickerItem.name;
                            }
                        }
                        else if (referencedMsg.attachments.size > 0) {
                            attachment = referencedMsg.attachments.first() || null;
                        }
                    }
                }
                catch (e) {
                    console.log("Failed to fetch referenced message for sticker:", e);
                }
            }
        }
        if (!attachment) {
            return interaction.reply((0, embedUtils_1.createErrorEmbed)(interaction.user, "**Please provide a file or reply to a sticker/image.**").toPayload({ ephemeral: true }));
        }
        if (!name) {
            if (attachment.name) {
                name = attachment.name.replace(/\.[^/.]+$/, "");
            }
            else {
                name = "sticker_" + Date.now().toString().slice(-4);
            }
        }
        name = name.replace(/[^a-zA-Z0-9_]/g, '');
        if (name.length < 2)
            name = "sticker_" + Date.now().toString().slice(-4);
        const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
        if (attachment.contentType && !validTypes.some(t => { var _a; return (_a = attachment.contentType) === null || _a === void 0 ? void 0 : _a.startsWith(t); })) {
            return interaction.reply((0, embedUtils_1.createErrorEmbed)(interaction.user, "**Invalid file type. Please provide a PNG, JPG, or GIF.**").toPayload({ ephemeral: true }));
        }
        try {
            yield interaction.deferReply();
            const sticker = yield interaction.guild.stickers.create({
                file: attachment.url,
                name: name,
                tags: name
            });
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.correct} Sticker Added`)
                .setDescription(`> Successfully added sticker to server.\n\n• **Name:** \`${name}\``)
                .setImage(sticker.url)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            yield interaction.editReply(embed.toPayload());
        }
        catch (err) {
            console.error(err);
            let errorMsg = "Failed to add sticker.";
            if (err.code === 30039)
                errorMsg = "Maximum number of stickers reached.";
            yield interaction.editReply((0, embedUtils_1.createErrorEmbed)(interaction.user, `**${errorMsg}**`).toPayload());
        }
    });
}
