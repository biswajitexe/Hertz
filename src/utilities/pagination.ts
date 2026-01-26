
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, ButtonInteraction, ComponentType } from "discord.js";

export async function pagination(interaction: ChatInputCommandInteraction, title: string, items: string[], itemsPerPage: number = 10, iconURL: string | null = null) {
    if (items.length === 0) {
        const embed = new EmbedBuilder()
            .setColor(0x00AAFF) // Config Primary hardcoded or import config if needed. using generic blue.
            .setDescription(`**No items found.**`)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
        if (iconURL) embed.setAuthor({ name: title, iconURL: iconURL });
        else embed.setTitle(title);

        return interaction.editReply({ embeds: [embed] });
    }

    const totalPages = Math.ceil(items.length / itemsPerPage);
    let currentPage = 0;

    const generateEmbed = (page: number) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const currentItems = items.slice(start, end);

        const embed = new EmbedBuilder()
            .setColor(0x00AAFF)
            .setFooter({ text: `Page ${page + 1} / ${totalPages} • Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(currentItems.join('\n'));

        if (iconURL) embed.setAuthor({ name: title, iconURL: iconURL });
        else embed.setTitle(title);

        return embed;
    };

    const generateButtons = (page: number) => {
        const row = new ActionRowBuilder<ButtonBuilder>();

        const prev = new ButtonBuilder()
            .setCustomId('prev')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0);

        const next = new ButtonBuilder()
            .setCustomId('next')
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages - 1);

        const stop = new ButtonBuilder()
            .setCustomId('stop')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger);

        row.addComponents(prev, stop, next);
        return row;
    };

    const initialEmbed = generateEmbed(currentPage);
    const initialButtons = generateButtons(currentPage);

    const msg = await interaction.editReply({
        embeds: [initialEmbed],
        components: totalPages > 1 ? [initialButtons] : []
    });

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
            return; // Stop handler will delete
        }

        if (currentPage < 0) currentPage = 0;
        if (currentPage >= totalPages) currentPage = totalPages - 1;

        await i.update({
            embeds: [generateEmbed(currentPage)],
            components: [generateButtons(currentPage)]
        });
    });

    collector.on('end', async () => {
        // Remove buttons on timeout
        try {
            await interaction.editReply({ components: [] });
        } catch (e) { }
    });
}
