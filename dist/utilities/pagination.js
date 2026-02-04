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
exports.pagination = pagination;
const discord_js_1 = require("discord.js");
function pagination(interaction_1, title_1, items_1) {
    return __awaiter(this, arguments, void 0, function* (interaction, title, items, itemsPerPage = 10, iconURL = null) {
        if (items.length === 0) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x00AAFF)
                .setDescription(`**No items found.**`)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
            if (iconURL)
                embed.setAuthor({ name: title, iconURL: iconURL });
            else
                embed.setTitle(title);
            return interaction.editReply({ embeds: [embed] });
        }
        const totalPages = Math.ceil(items.length / itemsPerPage);
        let currentPage = 0;
        const generateEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const currentItems = items.slice(start, end);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x00AAFF)
                .setFooter({ text: `Page ${page + 1} / ${totalPages} • Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setDescription(currentItems.join('\n'));
            if (iconURL)
                embed.setAuthor({ name: title, iconURL: iconURL });
            else
                embed.setTitle(title);
            return embed;
        };
        const generateButtons = (page) => {
            const row = new discord_js_1.ActionRowBuilder();
            const prev = new discord_js_1.ButtonBuilder()
                .setCustomId('prev')
                .setEmoji('1465399219623039038')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(page === 0);
            const next = new discord_js_1.ButtonBuilder()
                .setCustomId('next')
                .setEmoji('1465399275805741292')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(page === totalPages - 1);
            const stop = new discord_js_1.ButtonBuilder()
                .setCustomId('stop')
                .setEmoji('1465399171799453706')
                .setStyle(discord_js_1.ButtonStyle.Danger);
            row.addComponents(prev, stop, next);
            return row;
        };
        const initialEmbed = generateEmbed(currentPage);
        const initialButtons = generateButtons(currentPage);
        const msg = yield interaction.editReply({
            embeds: [initialEmbed],
            components: totalPages > 1 ? [initialButtons] : []
        });
        if (totalPages <= 1)
            return;
        const collector = msg.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            time: 60000
        });
        collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
            if (i.user.id !== interaction.user.id) {
                yield i.reply({ content: 'This menu is not for you.', ephemeral: true });
                return;
            }
            if (i.customId === 'prev') {
                currentPage--;
            }
            else if (i.customId === 'next') {
                currentPage++;
            }
            else if (i.customId === 'stop') {
                collector.stop();
                return;
            }
            if (currentPage < 0)
                currentPage = 0;
            if (currentPage >= totalPages)
                currentPage = totalPages - 1;
            yield i.update({
                embeds: [generateEmbed(currentPage)],
                components: [generateButtons(currentPage)]
            });
        }));
        collector.on('end', () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield interaction.editReply({ components: [] });
            }
            catch (e) { }
        }));
    });
}
