
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { snipeCache } from "../../structures/SnipeManager";

export const command = new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Recover the last deleted message in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const snipes = snipeCache.get(interaction.channelId);

    if (!snipes || snipes.length === 0) {
        return interaction.reply({ content: `${config.emojis.error} There is nothing to snipe here!`, ephemeral: true });
    }

    const data = snipes[0]; // Get latest

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({ name: data.authorTag, iconURL: data.authorAvatar || undefined })
        .setDescription(data.content || "*No content (Image only)*")
        .setFooter({ text: `Sniped by ${interaction.user.tag} | Deleted` });

    if (data.image) {
        embed.setImage(data.image);
    }

    await interaction.reply({ embeds: [embed] });
}
