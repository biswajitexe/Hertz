
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, Role } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

import { pagination } from "../../utilities/pagination";

export const command = new SlashCommandBuilder()
    .setName('list')
    .setDescription('List roles, bots, admins, or members in a role.')
    .addSubcommand(sub => sub.setName('roles').setDescription('List all roles in the server'))
    .addSubcommand(sub => sub.setName('bots').setDescription('List all bots in the server'))
    .addSubcommand(sub => sub.setName('admins').setDescription('List all admins in the server'))
    .addSubcommand(sub =>
        sub.setName('inrole')
            .setDescription('List members in a specific role')
            .addRoleOption(opt => opt.setName('role').setDescription('The role to check').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    // Radius Argument Parsing (Prefix Support)
    let subcommand: string | null = null;
    let targetRole: Role | null = null;

    try {
        subcommand = interaction.options.getSubcommand();
        targetRole = interaction.options.getRole('role') as Role;
    } catch (e) { }

    // Manual Parsing if Slash failed or Prefix usage
    if (!subcommand) {
        const msg = interaction as any; // Type casting for prefix shim
        if (msg.content) {
            const args = msg.content.trim().split(/ +/);
            // args[0] is command, args[1] is subcommand
            const rawSub = args[1]?.toLowerCase();

            if (['role', 'roles'].includes(rawSub)) subcommand = 'roles';
            else if (['bot', 'bots'].includes(rawSub)) subcommand = 'bots';
            else if (['admin', 'admins'].includes(rawSub)) subcommand = 'admins';
            else if (['inrole', 'members'].includes(rawSub)) {
                subcommand = 'inrole';
                // Try to find role by name or ID in args[2]
                const roleQuery = args.slice(2).join(' ');
                if (roleQuery) {
                    targetRole = interaction.guild.roles.cache.find(r => r.id === roleQuery || r.name.toLowerCase() === roleQuery.toLowerCase() || r.toString() === roleQuery) || null;
                }
            }
        }
    }

    if (!subcommand) {
        // show help if no subcommand found
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('<:4497kazuhawaiter:1461641597476274332> List Commands')
            .setDescription('\`?list roles\`\n\`?list bots\`\n\`?list admins\`\n\`?list inrole <role>\`')
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
        return;
    }

    await interaction.deferReply();

    // Helper for list display (Whitelist Style)
    // Format: `「1」` | `Name「ID」`
    const getFormattedList = (items: { name: string, id: string, extra?: string }[]) => {
        return items.map((item, i) => `\`「${i + 1}」\` | \`${item.name}「${item.id}」\`${item.extra ? ` (${item.extra})` : ''}`);
    };

    // Generic Icon (Purple Shield style from WL)
    const icon = 'https://cdn.discordapp.com/emojis/1461641597476274332.png';

    try {
        let items: { name: string, id: string, extra?: string }[] = [];
        let title = '';

        if (subcommand === 'roles') {
            title = 'Server Roles';
            items = interaction.guild.roles.cache
                .sort((a, b) => b.position - a.position)
                .map(r => ({ name: r.name, id: r.id, extra: `${r.members.size} members` }));

        } else if (subcommand === 'bots') {
            title = 'Server Bots';
            const fetchedMembers = await interaction.guild.members.fetch();
            items = fetchedMembers
                .filter(m => m.user.bot)
                .map(m => ({ name: m.user.username, id: m.id }));

        } else if (subcommand === 'admins') {
            title = 'Server Admins';
            const fetchedMembers = await interaction.guild.members.fetch();
            items = fetchedMembers
                .filter(m => m.permissions.has(PermissionFlagsBits.Administrator) && !m.user.bot)
                .map(m => ({ name: m.user.username, id: m.id }));

        } else if (subcommand === 'inrole') {
            if (!targetRole) {
                await interaction.editReply({ content: `${config.emojis.error} **Please specify a valid role.**` });
                return;
            }
            title = `Members in ${targetRole.name}`;
            // Ensure members are fetched
            await interaction.guild.members.fetch();
            items = targetRole.members.map(m => ({ name: m.user.username, id: m.id }));
        }

        const formattedLines = getFormattedList(items);
        await pagination(interaction, title, formattedLines, 10, icon);

    } catch (err) {
        console.error(err);
        await interaction.editReply({ content: `${config.emojis.error} Failed to fetch list.` });
    }
}
