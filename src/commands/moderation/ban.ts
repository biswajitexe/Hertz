
import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import * as config from "../../config";
import ms from "ms";
import { logAction } from "../../utilities/modLogger";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";

export const command = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server (Advanced)')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user to ban.')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('The reason for the ban.')
    )
    .addStringOption(option => option
        .setName('duration')
        .setDescription('Temporary ban duration (e.g. 1d, 30m). Leave empty for permanent.')
    )
    .addStringOption(option => option
        .setName('delete_history')
        .setDescription('Delete message history.')
        .addChoices(
            { name: 'None', value: '0' },
            { name: '1 Hour', value: '3600' },
            { name: '6 Hours', value: '21600' },
            { name: '12 Hours', value: '43200' },
            { name: '24 Hours', value: '86400' },
            { name: '3 Days', value: '259200' },
            { name: '7 Days', value: '604800' }
        )
    )
    .addBooleanOption(option => option
        .setName('silent')
        .setDescription('If true, the ban confirmation will be hidden from public chat.')
    )
    .addAttachmentOption(option => option
        .setName('evidence')
        .setDescription('Screenshot proof/evidence for the ban.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const user = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || "No reason provided";
    const durationStr = interaction.options.getString('duration');
    const deleteSeconds = parseInt(interaction.options.getString('delete_history') || '0');
    const silent = interaction.options.getBoolean('silent') || false;
    const evidence = interaction.options.getAttachment('evidence');

    // 0. Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers) && interaction.user.id !== process.env.OWNER_ID) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You do not have permission to ban members.**")], ephemeral: true });
        return;
    }

    if (!user) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**Please provide a valid User.**\nUsage: `?ban <user> [reason]`")], ephemeral: true });
        return;
    }

    if (!(user instanceof GuildMember)) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "Target is not a member of this server. (Force ban by ID not implemented yet)")], ephemeral: true });
        return;
    }

    // 1. Check Self/Bot/Owner
    if (user.id === interaction.user.id) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot ban yourself.**")], ephemeral: true });
        return;
    }
    if (user.id === interaction.client.user.id) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot ban me.**")], ephemeral: true });
        return;
    }
    if (user.id === interaction.guild.ownerId && interaction.user.id !== process.env.OWNER_ID) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot ban the server owner.**")], ephemeral: true });
        return;
    }

    // 2. Hierarchy Checks
    if (!user.bannable) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**I cannot ban this user. My role is likely below theirs.**")], ephemeral: true });
        return;
    }
    if (!canModerate(interaction.member, user, PermissionFlagsBits.BanMembers)) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot ban this user due to role hierarchy.**")], ephemeral: true });
        return;
    }

    await interaction.deferReply({ ephemeral: silent });

    // 3. Duration Logic
    let endTime: number | null = null;
    let durationFormatted = "Permanent";

    if (durationStr) {
        try {
            const milliseconds = ms(durationStr);
            if (!milliseconds || milliseconds < 1000) {
                await interaction.editReply({ embeds: [createErrorEmbed(interaction.user, "Invalid duration format. Example: `1d`, `30m`")] });
                return;
            }
            endTime = Date.now() + milliseconds;
            durationFormatted = ms(milliseconds, { long: true });
        } catch (e) {
            await interaction.editReply({ embeds: [createErrorEmbed(interaction.user, "Invalid duration string.")] });
            return;
        }
    }

    // 4. DM User
    try {
        const dmEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`You have been banned from ${interaction.guild.name}`)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Duration', value: durationFormatted },
                { name: 'Moderator', value: interaction.user.tag }
            )
            .setTimestamp();
        await user.send({ embeds: [dmEmbed] });
    } catch (e) { }

    // 5. Execute Ban
    try {
        await user.ban({ reason: `[Banned by ${interaction.user.tag}] ${reason}`, deleteMessageSeconds: deleteSeconds });

        // Database (Temp Ban)
        if (endTime) {
            const guildData = await database.retrieveGuild(interaction.guild.id);
            if (guildData) {
                guildData.tempBans.push({
                    userId: user.id,
                    endTime: endTime,
                    moderatorId: interaction.user.id,
                    reason: reason
                });
                await database.insertGuild(interaction.guild.id, guildData);
            }
        }

        // Mod Log
        let extraInfo = `**Duration**: ${durationFormatted}\n**Deleted History**: ${deleteSeconds ? ms(deleteSeconds * 1000, { long: true }) : 'None'}`;
        if (evidence) extraInfo += `\n**Evidence**: [Link](${evidence.url})`;

        await logAction(interaction.guild, user.user, interaction.user, 'BAN', reason, database, extraInfo);

        // 6. Success Reply
        const successEmbed = createSuccessEmbed(interaction.user, `**Banned ${user.user.tag}**`)
            .addFields({ name: 'Reason', value: reason, inline: false });

        if (durationStr) successEmbed.addFields({ name: 'Duration', value: durationFormatted, inline: false });
        if (evidence) successEmbed.setImage(evidence.url);

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ embeds: [createErrorEmbed(interaction.user, "**Failed to ban user.**")] });
    }
}