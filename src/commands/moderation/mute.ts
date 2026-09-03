import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, SlashCommandBuilder } from "discord.js";
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
        await interaction.reply(createErrorEmbed(interaction.user, "**You do not have permission to mute members.**").toPayload({ ephemeral: true }));
        return;
    }

    if (!user) {
        await interaction.reply(createErrorEmbed(interaction.user, "**Please provide a valid User.**\nUsage: `?mute <user> [duration] [reason]`").toPayload({ ephemeral: true }));
        return;
    }

    if (!(user instanceof GuildMember)) {
        await interaction.reply(createErrorEmbed(interaction.user, "User is not in the server.").toPayload({ ephemeral: true }));
        return;
    }

    // 1. Safety Checks
    if (user.id === interaction.user.id) {
        await interaction.reply(createErrorEmbed(interaction.user, "**You cannot mute yourself.**").toPayload({ ephemeral: true }));
        return;
    }
    if (user.id === interaction.client.user.id) {
        await interaction.reply(createErrorEmbed(interaction.user, "**You cannot mute me.**").toPayload({ ephemeral: true }));
        return;
    }
    if (user.id === interaction.guild.ownerId) {
        await interaction.reply(createErrorEmbed(interaction.user, "**You cannot mute the server owner.**").toPayload({ ephemeral: true }));
        return;
    }
    if (!user.moderatable) {
        await interaction.reply(createErrorEmbed(interaction.user, "**I cannot mute this user. My role is likely below theirs.**").toPayload({ ephemeral: true }));
        return;
    }

    if (!canModerate(interaction.member, user, PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply(createErrorEmbed(interaction.user, "**You cannot moderate this user due to role hierarchy.**").toPayload({ ephemeral: true }));
        return;
    }

    // 2. Duration Check
    let timeMs: number;
    try {
        timeMs = ms(durationStr);
        if (!timeMs || timeMs < 1000 || timeMs > 28 * 24 * 60 * 60 * 1000) {
            await interaction.reply(createErrorEmbed(interaction.user, "Invalid duration. Must be between 1 second and 28 days. Example: `1h`, `30m`.").toPayload({ ephemeral: true }));
            return;
        }
    } catch {
        await interaction.reply(createErrorEmbed(interaction.user, "Invalid duration format.").toPayload({ ephemeral: true }));
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

        await interaction.editReply(successEmbed.toPayload());

    } catch (error) {
        console.error(error);
        await interaction.editReply(createErrorEmbed(interaction.user, "**Failed to mute user.**").toPayload());
    }
}
