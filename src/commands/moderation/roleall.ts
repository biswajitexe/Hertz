
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

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
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage roles (Admin only).`, ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand(false);
    const role = interaction.options.getRole('role');

    if (!subcommand || !role) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setDescription(`\`?roleall add <role>\`\n\`?roleall remove <role>\``)
            .setFooter({ text: `Xeon • Advanced Moderation`, iconURL: interaction.client.user.displayAvatarURL() });
        return interaction.reply({ embeds: [embed] });
    }

    // Safety Checks
    const botMember = await interaction.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({ content: `${config.emojis.error} I cannot manage this role (it is higher or equal to my highest role).`, ephemeral: true });
    }

    if (role.managed) {
        return interaction.reply({ content: `${config.emojis.error} I cannot manage this role (it is managed by an integration).`, ephemeral: true });
    }

    await interaction.deferReply();

    // Fetch all members
    const members = await interaction.guild.members.fetch();
    const allMembers = Array.from(members.values());
    const validMembers = allMembers.filter(m => !m.user.bot); // Skip bots for roleall

    let count = 0;
    let failed = 0;
    const batchSize = 10; // Process 10 users at a time to avoid heavy RL but improve speed

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
                return false; // No action needed
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

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`${config.emojis.success} **Added role ${role.name} to ${count} members.** (Failed: ${failed})`);
        await interaction.editReply({ content: '', embeds: [embed] });

    } else if (subcommand === 'remove') {
        await interaction.editReply({ content: `${config.emojis.loading || "🔄"} Processing **${validMembers.length}** members... This may take a while.` });

        for (let i = 0; i < validMembers.length; i += batchSize) {
            const batch = validMembers.slice(i, i + batchSize);
            await processBatch(batch, 'remove');
        }

        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription(`${config.emojis.success} **Removed role ${role.name} from ${count} members.** (Failed: ${failed})`);
        await interaction.editReply({ content: '', embeds: [embed] });
    }
}
