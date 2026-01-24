
import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import { logAction } from "../../utilities/modLogger";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Manage user warnings')
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Issue a warning to a user')
            .addUserOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
            .addStringOption(option => option.setName('reason').setDescription('The reason for the warning').setRequired(false))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('View a user\'s warnings')
            .addUserOption(option => option.setName('user').setDescription('The user to check').setRequired(false))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove a specific warning')
            .addUserOption(option => option.setName('user').setDescription('The user to manage').setRequired(true))
            .addStringOption(option => option.setName('id').setDescription('The warning ID to remove').setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('clear')
            .setDescription('Clear all warnings for a user')
            .addUserOption(option => option.setName('user').setDescription('The user to reset').setRequired(true))
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getMember('user');
    const targetUser = interaction.options.getUser('user');

    // Only check for targetUser if NOT listing (Listing can be empty/global)
    if (!targetUser && subcommand !== 'list') {
        return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**Please provide a valid User.**\nUsage: `?warn <add|remove|list|clear> <user> ...`")], ephemeral: true });
    }

    // --- Subcommand: LIST ---
    if (subcommand === 'list') {
        const guildData = await database.retrieveGuild(interaction.guild.id);

        if (targetUser) {
            // Specific User Warns (Existing Logic)
            const userWarns = guildData?.warns?.[targetUser.id] || [];

            if (userWarns.length === 0) {
                return interaction.reply({ content: `${config.emojis.success} **${targetUser.username}** has no warnings.`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: `warnings list for ${targetUser.username}`, iconURL: 'https://cdn.discordapp.com/emojis/1461641597476274332.png' })
                .setDescription(userWarns.map((w, index) => {
                    return `\`「${index + 1}」\` | \`${w.reason}\` - <t:${Math.floor(w.timestamp / 1000)}:R>`;
                }).join('\n'))
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            return interaction.reply({ embeds: [embed] });
        } else {
            // Global Warn List (New Logic)
            if (!guildData || !guildData.warns || Object.keys(guildData.warns).length === 0) {
                return interaction.reply({ content: `${config.emojis.error} **No warnings found in this server.**`, ephemeral: true });
            }

            const warnedUsers = Object.entries(guildData.warns).filter(([_, warns]) => warns.length > 0);

            if (warnedUsers.length === 0) {
                return interaction.reply({ content: `${config.emojis.error} **No active warnings found.**`, ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: `School Warn List`, iconURL: interaction.guild.iconURL() || undefined }) // "School" matches user context or generic
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            // Resolving usernames might be slow, so we use IDs or Cache. 
            // Better to just show ID + Count for speed, or fetch if list is small. 
            // Let's maximize reliability with ID format first.

            const list = await Promise.all(warnedUsers.map(async ([userId, warns], index) => {
                let username = userId;
                try {
                    const user = await interaction.client.users.fetch(userId);
                    username = user.username;
                } catch { username = 'Unknown User'; }

                return `\`「${index + 1}」\` | \`${username} (${userId})\` - **${warns.length} Warns**`;
            }));

            embed.setDescription(list.join('\n').slice(0, 4000));
            return interaction.reply({ embeds: [embed] });
        }
    }

    // --- Subcommand: ADD ---
    if (subcommand === 'add') {
        const reason = interaction.options.getString('reason') || "No reason provided";

        // Permission & Safety Checks
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You do not have permission to warn members.**")], ephemeral: true });
        }
        if (!user || !(user instanceof GuildMember)) {
            return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**User is not in the server.**")], ephemeral: true });
        }
        if (user.id === interaction.user.id) {
            return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot warn yourself.**")], ephemeral: true });
        }
        if (user.id === interaction.client.user.id) {
            return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot warn me.**")], ephemeral: true });
        }
        if (user.id === interaction.guild.ownerId) {
            return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot warn the server owner.**")], ephemeral: true });
        }
        if (!canModerate(interaction.member, user, PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You cannot warn this user due to role hierarchy.**")], ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const guildData = await database.retrieveGuild(interaction.guild.id);
            if (!guildData) return interaction.editReply({ content: "Database error." });

            if (!guildData.warns) guildData.warns = {};
            if (!guildData.warns[user.id]) guildData.warns[user.id] = [];

            const warnId = Math.random().toString(36).substring(2, 10).toUpperCase();
            guildData.warns[user.id].push({
                id: warnId,
                moderatorId: interaction.user.id,
                reason: reason,
                timestamp: Date.now()
            });

            await database.insertGuild(interaction.guild.id, guildData);

            // Log
            const extraInfo = `**Warn ID**: \`${warnId}\`\n**Total Warns**: ${guildData.warns[user.id].length}`;
            await logAction(interaction.guild, user.user, interaction.user, 'WARN', reason, database, extraInfo);

            const successEmbed = createSuccessEmbed(interaction.user, `**Warned ${user.user.tag}**`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Total Warns', value: `${guildData.warns[user.id].length}`, inline: true }
                );

            return interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            return interaction.editReply({ embeds: [createErrorEmbed(interaction.user, "**Failed to warn user.**")] });
        }
    }

    // --- Subcommand: REMOVE ---
    if (subcommand === 'remove') {
        const warnId = interaction.options.getString('id', true);
        if (!targetUser) return;

        const guildData = await database.retrieveGuild(interaction.guild.id);
        if (!guildData || !guildData.warns || !guildData.warns[targetUser.id]) {
            return interaction.reply({ content: `${config.emojis.error} This user has no warnings.`, ephemeral: true });
        }

        const initialLength = guildData.warns[targetUser.id].length;
        guildData.warns[targetUser.id] = guildData.warns[targetUser.id].filter(w => w.id !== warnId);

        if (guildData.warns[targetUser.id].length === initialLength) {
            return interaction.reply({ content: `${config.emojis.error} Warning ID \`${warnId}\` not found for this user.`, ephemeral: true });
        }

        await database.insertGuild(interaction.guild.id, guildData);

        const embed = new EmbedBuilder()
            .setColor(0x57F287) // Success color
            .setDescription(`${config.emojis.success} **Warning Deleted**\n${config.emojis.dot} **Target:** ${targetUser.tag}\n${config.emojis.dot} **ID:** ${warnId}`);

        return interaction.reply({ embeds: [embed] });
    }

    // --- Subcommand: CLEAR ---
    if (subcommand === 'clear') {
        if (!targetUser) return;
        const guildData = await database.retrieveGuild(interaction.guild.id);
        if (!guildData || !guildData.warns || !guildData.warns[targetUser.id] || guildData.warns[targetUser.id].length === 0) {
            return interaction.reply({ content: `${config.emojis.error} This user has no warnings to clear.`, ephemeral: true });
        }

        const count = guildData.warns[targetUser.id].length;
        delete guildData.warns[targetUser.id];
        await database.insertGuild(interaction.guild.id, guildData);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`${config.emojis.success} Cleared **${count}** warnings for **${targetUser.tag}**.`);

        return interaction.reply({ embeds: [embed] });
    }
}
