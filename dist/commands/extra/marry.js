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
    .setName('marry')
    .setDescription('Propose to a user.')
    .addUserOption(option => option.setName('user').setDescription('The user you want to marry').setRequired(true));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const target = interaction.options.getUser('user', true);
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: `${config.emojis.error} You cannot marry yourself!`, ephemeral: true });
        }
        if (target.bot) {
            return interaction.reply({ content: `${config.emojis.error} You cannot marry a bot!`, ephemeral: true });
        }
        const proposerProfile = yield database.getUser(interaction.user.id);
        if (proposerProfile.partnerId) {
            return interaction.reply({ content: `${config.emojis.error} You are already married!`, ephemeral: true });
        }
        const targetProfile = yield database.getUser(target.id);
        if (targetProfile.partnerId) {
            return interaction.reply({ content: `${config.emojis.error} ${target.username} is already married!`, ephemeral: true });
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config.colors.primary)
            .setDescription(`**Marriage Proposal** 💍\n\n${target}, **${interaction.user.username}** has proposed to you!\nDo you accept?`)
            .setFooter({ text: 'This proposal expires in 60 seconds.' });
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder().setCustomId('marry_accept').setLabel('Yes, I do!').setStyle(discord_js_1.ButtonStyle.Success).setEmoji('💍'), new discord_js_1.ButtonBuilder().setCustomId('marry_decline').setLabel('No, thanks').setStyle(discord_js_1.ButtonStyle.Danger));
        const msg = yield interaction.reply({ content: `${target}`, embeds: [embed], components: [row], fetchReply: true });
        const filter = (i) => i.user.id === target.id;
        const collector = msg.createMessageComponentCollector({ filter, componentType: discord_js_1.ComponentType.Button, time: 60000 });
        collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
            if (i.customId === 'marry_accept') {
                proposerProfile.partnerId = target.id;
                proposerProfile.marryDate = Date.now();
                targetProfile.partnerId = interaction.user.id;
                targetProfile.marryDate = Date.now();
                yield database.updateUser(proposerProfile);
                yield database.updateUser(targetProfile);
                const acceptEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.success)
                    .setDescription(`💖 **Congratulations!** 💖\n\n${interaction.user} and ${target} are now married! 💍`)
                    .setImage("https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif");
                yield i.update({ content: null, embeds: [acceptEmbed], components: [] });
            }
            else {
                const declineEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.error)
                    .setDescription(`💔 **Proposal Declined**\n\n${target} turned down the proposal.`);
                yield i.update({ content: null, embeds: [declineEmbed], components: [] });
            }
        }));
        collector.on('end', (collected, reason) => __awaiter(this, void 0, void 0, function* () {
            if (reason === 'time') {
                yield msg.edit({ content: `${config.emojis.error} Proposal expired.`, components: [] });
            }
        }));
    });
}
