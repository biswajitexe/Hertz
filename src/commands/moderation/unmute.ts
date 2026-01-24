import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import * as config from "../../config";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";
import { logAction } from "../../utilities/modLogger";

export const command = new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute (remove timeout) a user.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user to unmute.')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('The reason for the unmute.')
    );

export const aliases = ['untm', 'untimeout'];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const user = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || "No reason provided";

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to unmute members.`, ephemeral: true });
    }

    if (!user) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**Please provide a valid User.**\nUsage: `?unmute <user> [reason]`")], ephemeral: true });
        return;
    }

    if (!(user instanceof GuildMember)) {
        await interaction.reply({ content: `${config.emojis.error} User is not in the server.`, ephemeral: true });
        return;
    }

    // Safety Checks (Standardization)
    if (user.id === interaction.user.id) {
        await interaction.reply({ content: `${config.emojis.error} **You cannot unmute yourself.**`, ephemeral: true });
        return;
    }
    if (!canModerate(interaction.member, user, PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: `${config.emojis.error} **You cannot moderate this user due to role hierarchy.**`, ephemeral: true });
        return;
    }

    if (!user.isCommunicationDisabled()) {
        await interaction.reply({ content: `${config.emojis.error} **This user is not muted.**`, ephemeral: true });
        return;
    }

    await interaction.deferReply();

    try {
        await user.timeout(null, reason);

        // Mod Log
        await logAction(interaction.guild, user.user, interaction.user, 'UNMUTE', reason, database);

        const successEmbed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`<:icocorrect46:1458159679988432948> **Unmuted ${user.user.tag}**`);

        if (reason !== "No reason provided") {
            successEmbed.addFields({ name: 'Reason', value: reason, inline: false });
        }

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: `${config.emojis.error} **Failed to unmute user.**` });
    }
}
