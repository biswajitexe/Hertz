
import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import { logAction } from "../../utilities/modLogger";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";

export const command = new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user to kick.')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('The reason for the kick.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const user = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || "No reason provided";

    // 0. Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers) && interaction.user.id !== process.env.OWNER_ID) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You do not have permission to kick members.**")], ephemeral: true });
        return;
    }

    if (!user) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**Please provide a valid User.**\nUsage: `?kick <user> [reason]`")], ephemeral: true });
        return;
    }

    if (!(user instanceof GuildMember)) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "User is not in the server.")], ephemeral: true });
        return;
    }

    // 1. Safety Checks
    if (user.id === interaction.user.id) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot kick yourself.**")], ephemeral: true });
        return;
    }
    if (user.id === interaction.client.user.id) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot kick me.**")], ephemeral: true });
        return;
    }
    if (user.id === interaction.guild.ownerId) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot kick the server owner.**")], ephemeral: true });
        return;
    }
    if (!user.kickable) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**I cannot kick this user. My role is likely below theirs.**")], ephemeral: true });
        return;
    }

    if (!canModerate(interaction.member, user, PermissionFlagsBits.KickMembers)) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot kick this user due to role hierarchy.**")], ephemeral: true });
        return;
    }

    await interaction.deferReply();

    // 2. DM User
    try {
        const dmEmbed = createErrorEmbed(interaction.user, `You have been kicked from **${interaction.guild.name}**`) // Using Error style for punishment DM
            .setTitle(`You have been kicked from ${interaction.guild.name}`)
            .setDescription(null)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Moderator', value: interaction.user.tag }
            );
        await user.send({ embeds: [dmEmbed] });
    } catch (e) { }

    // 3. Execute Kick
    try {
        await user.kick(reason);

        // Mod Log
        await logAction(interaction.guild, user.user, interaction.user, 'KICK', reason, database);

        // Success Reply
        const successEmbed = createSuccessEmbed(interaction.user, `**Kicked ${user.user.tag}**`)
            .addFields({ name: 'Reason', value: reason, inline: false });

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ embeds: [createErrorEmbed(interaction.user, "**Failed to kick user.**")] });
    }
}