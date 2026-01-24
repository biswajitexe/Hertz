
import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import ms from 'ms';
import { logAction } from "../../utilities/modLogger";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";

export const command = new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute (timeout) a user.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user to mute.')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('duration')
        .setDescription('Duration (e.g. 1h, 30m, 1d) [Default: 10m].')
        .setRequired(false)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('The reason for the mute.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const user = interaction.options.getMember('user');
    const rawDuration = interaction.options.getString('duration');
    const durationStr = rawDuration || "10m";
    const reason = interaction.options.getString('reason') || "No reason provided";

    // 0. Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) && interaction.user.id !== process.env.OWNER_ID) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You do not have permission to mute members.**")], ephemeral: true });
        return;
    }

    if (!user) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**Please provide a valid User.**\nUsage: `?mute <user> [duration] [reason]`")], ephemeral: true });
        return;
    }

    if (!(user instanceof GuildMember)) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "User is not in the server.")], ephemeral: true });
        return;
    }

    // 1. Safety Checks
    if (user.id === interaction.user.id) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot mute yourself.**")], ephemeral: true });
        return;
    }
    if (user.id === interaction.client.user.id) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot mute me.**")], ephemeral: true });
        return;
    }
    if (user.id === interaction.guild.ownerId) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot mute the server owner.**")], ephemeral: true });
        return;
    }
    if (!user.moderatable) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**I cannot mute this user. My role is likely below theirs.**")], ephemeral: true });
        return;
    }

    if (!canModerate(interaction.member, user, PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot moderate this user due to role hierarchy.**")], ephemeral: true });
        return;
    }

    // 2. Duration Check
    let timeMs: number;
    try {
        timeMs = ms(durationStr);
        if (!timeMs || timeMs < 1000 || timeMs > 28 * 24 * 60 * 60 * 1000) {
            await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "Invalid duration. Must be between 1 second and 28 days. Example: `1h`, `30m`.")], ephemeral: true });
            return;
        }
    } catch {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "Invalid duration format.")], ephemeral: true });
        return;
    }

    await interaction.deferReply();

    const durationFormatted = ms(timeMs, { long: true });

    // 3. Execute Mute (Timeout)
    try {
        await user.timeout(timeMs, reason);

        // Mod Log
        const extraInfo = `**Duration**: ${durationFormatted}`;
        await logAction(interaction.guild, user.user, interaction.user, 'MUTE', reason, database, extraInfo);

        // Success Reply
        const successEmbed = createSuccessEmbed(interaction.user, `**Muted ${user.user.tag}**`)
            .addFields({ name: 'Reason', value: reason, inline: false });

        if (rawDuration) {
            successEmbed.addFields({ name: 'Duration', value: durationFormatted, inline: false });
        }

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ embeds: [createErrorEmbed(interaction.user, "**Failed to mute user.**")] });
    }
}
