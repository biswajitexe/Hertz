import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('roleall')
    .setDescription('Manage roles for all members')
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Add a role to all members')
            .addRoleOption(option => option.setName('role').setDescription('The role').setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove a role from all members')
            .addRoleOption(option => option.setName('role').setDescription('The role').setRequired(true))
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2("You do not have permission to manage roles (Admin only).").toPayload({ ephemeral: true }));
    }

    const subcommand = interaction.options.getSubcommand(false);
    const role = interaction.options.getRole('role');

    if (!subcommand || !role) {
        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.roles} Mass Role Management`)
            .setDescription(`> Assign or strip roles across the server.\n\n• **Add:** \`${config.prefix}roleall add <role>\`\n• **Remove:** \`${config.prefix}roleall remove <role>\``)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        return interaction.reply(embed.toPayload());
    }

    const botMember = await interaction.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
        return interaction.reply(createErrorV2("I cannot manage this role (it is higher or equal to my highest role).").toPayload({ ephemeral: true }));
    }

    if (role.managed) {
        return interaction.reply(createErrorV2("I cannot manage this role (it is managed by an integration).").toPayload({ ephemeral: true }));
    }

    await interaction.deferReply();

    const members = await interaction.guild.members.fetch();
    const allMembers = Array.from(members.values());
    const validMembers = allMembers.filter(m => !m.user.bot);

    let count = 0;
    let failed = 0;
    const batchSize = 10;

    async function processBatch(batch: any[], action: 'add' | 'remove') {
        const promises = batch.map(async (member) => {
            try {
                if (action === 'add') {
                    if (!member.roles.cache.has(role!.id)) {
                        await member.roles.add(role!.id);
                        return true;
                    }
                } else {
                    if (member.roles.cache.has(role!.id)) {
                        await member.roles.remove(role!.id);
                        return true;
                    }
                }
                return false;
            } catch (e) {
                return 'error';
            }
        });

        const results = await Promise.all(promises);
        results.forEach(res => {
            if (res === true) count++;
            if (res === 'error') failed++;
        });
    }

    if (subcommand === 'add') {
        await interaction.editReply({ content: `${config.emojis.loading || "🔄"} Processing **${validMembers.length}** members... This may take a while.` });

        for (let i = 0; i < validMembers.length; i += batchSize) {
            const batch = validMembers.slice(i, i + batchSize);
            await processBatch(batch, 'add');
        }

        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.correct} Role Added`)
            .setDescription(`> Successfully assigned role to all members.\n\n• **Role:** ${role.name}\n• **Success:** \`${count}\` members\n• **Failed:** \`${failed}\` members`)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        await interaction.editReply({ content: null, ...embed.toPayload() });

    } else if (subcommand === 'remove') {
        await interaction.editReply({ content: `${config.emojis.loading || "🔄"} Processing **${validMembers.length}** members... This may take a while.` });

        for (let i = 0; i < validMembers.length; i += batchSize) {
            const batch = validMembers.slice(i, i + batchSize);
            await processBatch(batch, 'remove');
        }

        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.correct} Role Removed`)
            .setDescription(`> Successfully removed role from all members.\n\n• **Role:** ${role.name}\n• **Success:** \`${count}\` members\n• **Failed:** \`${failed}\` members`)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        await interaction.editReply({ content: null, ...embed.toPayload() });
    }
}
