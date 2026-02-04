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
    .setName('nuke')
    .setDescription('Clone and delete the current channel (clears all messages)')
    .setDescription('Clone and delete the current channel (clears all messages)');
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild || !interaction.channel)
            return;
        const channel = interaction.channel;
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageChannels)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: `${config.emojis.error} You do not have permission to use this command.`, ephemeral: true });
        }
        if (!channel.clone) {
            return interaction.reply({ content: `${config.emojis.error} This channel type cannot be nuked.`, ephemeral: true });
        }
        try {
            const confirmEmbed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.warning || 0xFFA500)
                .setDescription(`**Are you sure you want to nuke this channel?**\nThis will **permanently delete** all messages and clone the channel.`)
                .setFooter({ text: 'This action cannot be undone.' });
            const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('nuke_confirm')
                .setLabel('Yes, Nuke it!')
                .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
                .setCustomId('nuke_cancel')
                .setLabel('No, Cancel')
                .setStyle(discord_js_1.ButtonStyle.Secondary));
            const reply = yield interaction.reply({ embeds: [confirmEmbed], components: [buttons], fetchReply: true });
            const collector = reply.createMessageComponentCollector({ componentType: discord_js_1.ComponentType.Button, time: 30000 });
            collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'Only the person who requested the nuke can confirm it.', ephemeral: true });
                }
                if (i.customId === 'nuke_confirm') {
                    yield i.reply({ content: 'Nuking channel...', ephemeral: true });
                    const newChannel = yield channel.clone({ position: channel.position });
                    yield channel.delete();
                    const successEmbed = new discord_js_1.EmbedBuilder()
                        .setColor(0xED4245)
                        .setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif')
                        .setDescription(`${config.emojis.success || "💥"} **Channel Nuked!**\nAll messages have been cleared.`);
                    yield newChannel.send({ embeds: [successEmbed] });
                    yield newChannel.send({ content: `Action performed by <@${interaction.user.id}>` });
                }
                else if (i.customId === 'nuke_cancel') {
                    yield i.update({ content: 'Nuke action cancelled.', embeds: [], components: [] });
                    setTimeout(() => interaction.deleteReply().catch(() => { }), 5000);
                }
            }));
            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    interaction.deleteReply().catch(() => { });
                }
            });
        }
        catch (err) {
            console.error(err);
        }
    });
}
