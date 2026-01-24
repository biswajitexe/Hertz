
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, GuildMember } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('role')
    .setDescription('Manage user roles (Toggle)')
    .addUserOption(option => option.setName('user').setDescription('The user').setRequired(false))
    .addRoleOption(option => option.setName('role').setDescription('The role').setRequired(false));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    let targetUser = interaction.options.getUser('user');
    let role = interaction.options.getRole('role');

    // Flexible Argument Handling (Swap Check)
    if (!targetUser || !role) {
        const rawUserArg = interaction.options.getString('user');
        const rawRoleArg = interaction.options.getString('role');

        if (rawUserArg && rawRoleArg) {
            // Try swapping: User Arg might be Role, Role Arg might be User
            const swappedRole = await interaction.guild.roles.fetch(rawUserArg).catch(() => null);
            const swappedUser = await interaction.guild.members.fetch(rawRoleArg).then(m => m.user).catch(() => null);

            if (swappedRole && swappedUser) {
                role = swappedRole;
                targetUser = swappedUser;
            }
        }
    }

    if (!targetUser || !role) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setDescription(`\`?role <user> <role>\`\n\`?role <role> <user>\``)
            .setFooter({ text: `Xeon • Advanced Moderation`, iconURL: interaction.client.user.displayAvatarURL() });
        return interaction.reply({ embeds: [embed] });
    }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) return interaction.reply({ content: `${config.emojis.error} Member not found.`, ephemeral: true });

    // Check hierarchy for Bot
    const botMember = await interaction.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({ content: `${config.emojis.error} I cannot manage this role (it is higher or equal to my highest role).`, ephemeral: true });
    }

    // Check hierarchy for User
    if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== process.env.OWNER_ID) {
        const executor = interaction.member as GuildMember; // Cast as we are in cached guild
        if (role.position >= executor.roles.highest.position) {
            return interaction.reply({ content: `${config.emojis.error} You cannot manage this role (it is higher or equal to your highest role).`, ephemeral: true });
        }
    }

    try {
        // Permission Check
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage roles.`, ephemeral: true });
        }

        if (member.roles.cache.has(role.id)) {
            // REMOVE Logic
            await member.roles.remove(role.id);
            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setDescription(`${config.emojis.success} **Role Removed**\n${config.emojis.dot} **User:** ${targetUser.tag}\n${config.emojis.dot} **Role:** ${role.name}`);
            return interaction.reply({ embeds: [embed] });
        } else {
            // ADD Logic
            await member.roles.add(role.id);
            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(`${config.emojis.success} **Role Added**\n${config.emojis.dot} **User:** ${targetUser.tag}\n${config.emojis.dot} **Role:** ${role.name}`);
            return interaction.reply({ embeds: [embed] });
        }
    } catch (err) {
        console.error(err);
        return interaction.reply({ content: `${config.emojis.error} Failed to manage role.`, ephemeral: true });
    }
}
