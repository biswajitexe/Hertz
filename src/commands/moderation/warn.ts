import { PermissionFlagsBits, SlashCommandBuilder, GuildMember } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import { logAction } from "../../utilities/modLogger";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";
import * as config from "../../config";
import { V2Embed, createErrorV2, createSuccessV2 } from "../../utilities/componentV2";

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

    if (!targetUser && subcommand !== 'list') {
        return interaction.reply(createErrorEmbed(interaction.user, "**Please provide a valid User.**\nUsage: `?warn <add|remove|list|clear> <user> ...`").toPayload({ ephemeral: true }));
    }

    // --- Subcommand: LIST ---
    if (subcommand === 'list') {
        const guildData = await database.retrieveGuild(interaction.guild.id);

        if (targetUser) {
            const userWarns = guildData?.warns?.[targetUser.id] || [];

            if (userWarns.length === 0) {
                return interaction.reply(createSuccessV2(`**${targetUser.username}** has no warnings.`).toPayload({ ephemeral: true }));
            }

            const embed = new V2Embed()
                .setColor(config.colors.primary)
                .setAuthor(`Warnings list for ${targetUser.username}`, 'https://cdn.discordapp.com/emojis/1461641597476274332.png')
                .setDescription(userWarns.map((w, index) => {
                    return `\`「${index + 1}」\` | \`${w.reason}\` - <t:${Math.floor(w.timestamp / 1000)}:R>`;
                }).join('\n'))
                .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

            return interaction.reply(embed.toPayload());
        } else {
            if (!guildData || !guildData.warns || Object.keys(guildData.warns).length === 0) {
                return interaction.reply(createErrorV2("**No warnings found in this server.**").toPayload({ ephemeral: true }));
            }

            const warnedUsers = Object.entries(guildData.warns)
                .filter(([_, warns]) => warns.length > 0)
                .sort((a, b) => {
                    const latestA = Math.max(...a[1].map(w => w.timestamp));
                    const latestB = Math.max(...b[1].map(w => w.timestamp));
                    return latestB - latestA;
                })
                .slice(0, 10);

            if (warnedUsers.length === 0) {
                return interaction.reply(createErrorV2("**No active warnings found.**").toPayload({ ephemeral: true }));
            }

            await interaction.deferReply();

            const embed = new V2Embed()
                .setColor(config.colors.primary)
                .setAuthor(`Server Warn List (Top 10)`, interaction.guild.iconURL() || undefined)
                .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

            const list = await Promise.all(warnedUsers.map(async ([userId, warns], index) => {
                let username = userId;
                try {
                    const u = await interaction.client.users.fetch(userId);
                    username = u.username;
                } catch { username = 'Unknown User'; }

                return `\`「${index + 1}」\` | **${username}** (\`${userId}\`) - **${warns.length} Warns**`;
            }));

            embed.setDescription(list.join('\n'));
            return interaction.editReply(embed.toPayload());
        }
    }

    // --- Subcommand: ADD ---
    if (subcommand === 'add') {
        const reason = interaction.options.getString('reason') || "No reason provided";

        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply(createErrorEmbed(interaction.user, "**You do not have permission to warn members.**").toPayload({ ephemeral: true }));
        }
        if (!user || !(user instanceof GuildMember)) {
            return interaction.reply(createErrorEmbed(interaction.user, "**User is not in the server.**").toPayload({ ephemeral: true }));
        }
        if (user.id === interaction.user.id) {
            return interaction.reply(createErrorEmbed(interaction.user, "**You cannot warn yourself.**").toPayload({ ephemeral: true }));
        }
        if (user.id === interaction.client.user.id) {
            return interaction.reply(createErrorEmbed(interaction.user, "**You cannot warn me.**").toPayload({ ephemeral: true }));
        }
        if (user.id === interaction.guild.ownerId) {
            return interaction.reply(createErrorEmbed(interaction.user, "**You cannot warn the server owner.**").toPayload({ ephemeral: true }));
        }
        if (!canModerate(interaction.member, user, PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply(createErrorEmbed(interaction.user, "**You cannot warn this user due to role hierarchy.**").toPayload({ ephemeral: true }));
        }

        await interaction.deferReply();

        try {
            const guildData = await database.retrieveGuild(interaction.guild.id);
            if (!guildData) return interaction.editReply(createErrorV2("Database error.").toPayload());

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

            const extraInfo = `**Warn ID**: \`${warnId}\`\n**Total Warns**: ${guildData.warns[user.id].length}`;
            await logAction(interaction.guild, user.user, interaction.user, 'WARN', reason, database, extraInfo);

            const successEmbed = createSuccessEmbed(interaction.user, `**Warned ${user.user.tag}**`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Total Warns', value: `${guildData.warns[user.id].length}`, inline: true }
                );

            return interaction.editReply(successEmbed.toPayload());

        } catch (error) {
            console.error(error);
            return interaction.editReply(createErrorEmbed(interaction.user, "**Failed to warn user.**").toPayload());
        }
    }

    // --- Subcommand: REMOVE ---
    if (subcommand === 'remove') {
        const warnId = interaction.options.getString('id', true);
        if (!targetUser) return;

        const guildData = await database.retrieveGuild(interaction.guild.id);
        if (!guildData || !guildData.warns || !guildData.warns[targetUser.id]) {
            return interaction.reply(createErrorV2("This user has no warnings.").toPayload({ ephemeral: true }));
        }

        const initialLength = guildData.warns[targetUser.id].length;
        guildData.warns[targetUser.id] = guildData.warns[targetUser.id].filter(w => w.id !== warnId);

        if (guildData.warns[targetUser.id].length === initialLength) {
            return interaction.reply(createErrorV2(`Warning ID \`${warnId}\` not found for this user.`).toPayload({ ephemeral: true }));
        }

        await database.insertGuild(interaction.guild.id, guildData);

        const embed = new V2Embed()
            .setColor(0x57F287)
            .setTitle(`${config.emojis.success} Warning Deleted`)
            .setDescription(`${config.emojis.dot} **Target:** ${targetUser.tag}\n${config.emojis.dot} **ID:** ${warnId}`);

        return interaction.reply(embed.toPayload());
    }

    // --- Subcommand: CLEAR ---
    if (subcommand === 'clear') {
        if (!targetUser) return;
        const guildData = await database.retrieveGuild(interaction.guild.id);
        if (!guildData || !guildData.warns || !guildData.warns[targetUser.id] || guildData.warns[targetUser.id].length === 0) {
            return interaction.reply(createErrorV2("This user has no warnings to clear.").toPayload({ ephemeral: true }));
        }

        const count = guildData.warns[targetUser.id].length;
        delete guildData.warns[targetUser.id];
        await database.insertGuild(interaction.guild.id, guildData);

        const embed = new V2Embed()
            .setColor(0x57F287)
            .setTitle(`${config.emojis.success} Warnings Cleared`)
            .setDescription(`Cleared **${count}** warnings for **${targetUser.tag}**.`);

        return interaction.reply(embed.toPayload());
    }
}
