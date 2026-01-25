
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('divorce')
    .setDescription('Divorce your partner');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const userProfile = await database.getUser(interaction.user.id);

    if (!userProfile.partnerId) {
        return interaction.reply({ content: `${config.emojis.error} You are not married!`, ephemeral: true });
    }

    const partnerId = userProfile.partnerId;
    const partnerProfile = await database.getUser(partnerId);

    // Update DB
    userProfile.partnerId = null;
    userProfile.marryDate = null;

    partnerProfile.partnerId = null;
    partnerProfile.marryDate = null;

    await database.updateUser(userProfile);
    await database.updateUser(partnerProfile);

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setDescription(`**💔 Divorce**\n\n> You have divorced <@${partnerId}>. You are now single.`)
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    return interaction.reply({ embeds: [embed] });
}
