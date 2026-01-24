
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { snipeCache } from "../../structures/SnipeManager";

export const command = new SlashCommandBuilder()
    .setName('snipeall')
    .setDescription('Show a list of recently deleted messages in this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const snipes = snipeCache.get(interaction.channelId);

    if (!snipes || snipes.length === 0) {
        return interaction.reply({ content: `${config.emojis.error} There is nothing to snipe here!`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`Recently Deleted Messages in #${(interaction.channel as any).name}`)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

    let description = "";

    // Limit to 10 for display to avoid overflow
    const displaySnipes = snipes.slice(0, 10);

    displaySnipes.forEach((data, index) => {
        const time = Math.floor(data.timestamp / 1000);
        const content = data.content ? (data.content.length > 50 ? data.content.substring(0, 50) + "..." : data.content) : "[Image/Attachment]";

        description += `**${index + 1}.** <t:${time}:R> **${data.authorTag}**: ${content}\n`;
    });

    embed.setDescription(description);

    await interaction.reply({ embeds: [embed] });
}
