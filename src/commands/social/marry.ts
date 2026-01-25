
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Propose to someone')
    .addUserOption(opt => opt.setName('user').setDescription('The user to marry').setRequired(true));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const targetUser = interaction.options.getUser('user', true);

    if (targetUser.id === interaction.user.id) return interaction.reply({ content: `${config.emojis.error} You cannot marry yourself!`, ephemeral: true });
    if (targetUser.bot) return interaction.reply({ content: `${config.emojis.error} You cannot marry a bot!`, ephemeral: true });

    const proposerProfile = await database.getUser(interaction.user.id);
    const targetProfile = await database.getUser(targetUser.id);

    if (proposerProfile.partnerId) return interaction.reply({ content: `${config.emojis.error} You are already married! divorce first.`, ephemeral: true });
    if (targetProfile.partnerId) return interaction.reply({ content: `${config.emojis.error} **${targetUser.username}** is already married!`, ephemeral: true });

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setDescription(`**💍 Marriage Proposal**\n\n> **${targetUser.username}**, **${interaction.user.username}** has proposed to you!\n> Do you accept?`)
        .setFooter({ text: `Proposal expires in 30 seconds` });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('marry_accept').setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('💍'),
        new ButtonBuilder().setCustomId('marry_reject').setLabel('Reject').setStyle(ButtonStyle.Danger).setEmoji('✖️')
    );

    const reply = await interaction.reply({ content: `<@${targetUser.id}>`, embeds: [embed], components: [buttons] });

    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== targetUser.id) {
            return i.reply({ content: `${config.emojis.error} This proposal is difficult not for you!`, ephemeral: true });
        }

        if (i.customId === 'marry_reject') {
            await i.update({ content: null, embeds: [], components: [], content: `💔 **${targetUser.username}** rejected the proposal.` });
            return;
        }

        if (i.customId === 'marry_accept') {
            // Update Database
            const now = Date.now();

            proposerProfile.partnerId = targetUser.id;
            proposerProfile.marryDate = now;

            targetProfile.partnerId = interaction.user.id;
            targetProfile.marryDate = now;

            await database.updateUser(proposerProfile);
            await database.updateUser(targetProfile);

            await i.update({ content: null, embeds: [], components: [], content: `💍 **Congratulations!** **${interaction.user.username}** and **${targetUser.username}** are now married! 🎉` });
        }
    });

    collector.on('end', async (_, reason) => {
        if (reason === 'time') {
            await interaction.editReply({ content: `⏳ Proposal timed out.`, components: [] });
        }
    });
}
