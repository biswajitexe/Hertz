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
    .setName('divorce')
    .setDescription('Divorce your current partner.');
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const userProfile = yield database.getUser(interaction.user.id);
        if (!userProfile.partnerId) {
            return interaction.reply({ content: `${config.emojis.error} You are not married to anyone!`, ephemeral: true });
        }
        const partnerId = userProfile.partnerId;
        const partnerProfile = yield database.getUser(partnerId);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config.colors.warning)
            .setDescription(`⚠️ **Are you sure?**\n\nDo you really want to divorce <@${partnerId}>?`)
            .setFooter({ text: 'This action cannot be undone.' });
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder().setCustomId('divorce_confirm').setLabel('Yes, Divorce').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('divorce_cancel').setLabel('Cancel').setStyle(discord_js_1.ButtonStyle.Secondary));
        const msg = yield interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        const filter = (i) => i.user.id === interaction.user.id;
        const collector = msg.createMessageComponentCollector({ filter, componentType: discord_js_1.ComponentType.Button, time: 30000 });
        collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
            if (i.customId === 'divorce_confirm') {
                userProfile.partnerId = null;
                userProfile.marryDate = null;
                partnerProfile.partnerId = null;
                partnerProfile.marryDate = null;
                yield database.updateUser(userProfile);
                yield database.updateUser(partnerProfile);
                const successEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setDescription(`💔 **Divorced**\n\nYou have divorced <@${partnerId}>.`);
                yield i.update({ content: null, embeds: [successEmbed], components: [] });
            }
            else {
                yield i.update({ content: `${config.emojis.success} Cancelled.`, embeds: [], components: [] });
            }
        }));
        collector.on('end', (collected, reason) => __awaiter(this, void 0, void 0, function* () {
            if (reason === 'time') {
                yield msg.edit({ content: 'Action timed out.', components: [] });
            }
        }));
    });
}
