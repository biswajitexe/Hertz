import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ButtonInteraction, ComponentType } from "discord.js";
import * as config from "../config";
import { V2Embed } from "./componentV2";

export async function pagination(interaction: ChatInputCommandInteraction, title: string, items: string[], itemsPerPage: number = 10, iconURL: string | null = null) {
    if (items.length === 0) {
        const embed = new V2Embed()
            .setColor(config.colors.primary)
            .setTitle(title)
            .setDescription(`**No items found.**`)
            .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());
        if (iconURL) embed.setAuthor(title, iconURL);

        return interaction.editReply(embed.toPayload());
    }

    const totalPages = Math.ceil(items.length / itemsPerPage);
    let currentPage = 0;

    const generateButtons = (page: number) => {
        const row = new ActionRowBuilder<ButtonBuilder>();

        const prev = new ButtonBuilder()
            .setCustomId('prev')
            .setEmoji('1465399219623039038') // Custom Left Arrow
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0);

        const stop = new ButtonBuilder()
            .setCustomId('stop')
            .setEmoji('1465399171799453706') // Custom Delete/Purge
            .setStyle(ButtonStyle.Danger);

        const next = new ButtonBuilder()
            .setCustomId('next')
            .setEmoji('1465399275805741292') // Custom Right Arrow
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages - 1);

        row.addComponents(prev, stop, next);
        return row;
    };

    const generatePage = (page: number, withButtons: boolean = true) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const currentItems = items.slice(start, end);

        const embed = new V2Embed()
            .setColor(config.colors.primary)
            .setTitle(title)
            .setDescription(currentItems.join('\n'))
            .setFooter(`Page ${page + 1} / ${totalPages} • Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

        if (iconURL) embed.setAuthor(title, iconURL);
        if (withButtons && totalPages > 1) {
            embed.addActionRow(generateButtons(page));
        }

        return embed;
    };

    const initialPage = generatePage(currentPage);
    const msg = await interaction.editReply(initialPage.toPayload());

    if (totalPages <= 1) return;

    const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
    });

    collector.on('collect', async (i: ButtonInteraction) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply({ content: 'This menu is not for you.', ephemeral: true });
            return;
        }

        if (i.customId === 'prev') {
            currentPage--;
        } else if (i.customId === 'next') {
            currentPage++;
        } else if (i.customId === 'stop') {
            collector.stop();
            return;
        }

        if (currentPage < 0) currentPage = 0;
        if (currentPage >= totalPages) currentPage = totalPages - 1;

        await i.update(generatePage(currentPage).toPayload());
    });

    collector.on('end', async () => {
        try {
            await interaction.editReply(generatePage(currentPage, false).toPayload());
        } catch (e) { }
    });
}
