import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, GuildMember } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('role')
    .setDescription('Manage user roles (Toggle)')
    .addUserOption(option => option.setName('user').setDescription('The user').setRequired(false))
    .addRoleOption(option => option.setName('role').setDescription('The role').setRequired(false));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    let targetUser = interaction.options.getUser('user');
    let role = interaction.options.getRole('role');

    if (!targetUser || !role) {
        const rawUserArg = interaction.options.getString('user');
        const rawRoleArg = interaction.options.getString('role');

        if (rawUserArg && rawRoleArg) {
            const swappedRole = await interaction.guild.roles.fetch(rawUserArg).catch(() => null);
            const swappedUser = await interaction.guild.members.fetch(rawRoleArg).then(m => m.user).catch(() => null);

            if (swappedRole && swappedUser) {
                role = swappedRole;
                targetUser = swappedUser;
            }
        }
    }

    if (!targetUser || !role) {
        const embed = new V2Embed()
            .setColor(config.colors.primary)
            .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL())
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setDescription(`\`${config.prefix}role <user> <role>\`\n\`${config.prefix}role <role> <user>\``)
            .setFooter(`Hertz • Advanced Moderation`, interaction.client.user?.displayAvatarURL());
        return interaction.reply(embed.toPayload());
    }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) return interaction.reply(createErrorV2("Member not found.").toPayload({ ephemeral: true }));

    const botMember = await interaction.guild.members.fetchMe();
    if (role.position >= botMember.roles.highest.position) {
        return interaction.reply(createErrorV2("I cannot manage this role (it is higher or equal to my highest role).").toPayload({ ephemeral: true }));
    }

    if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== process.env.OWNER_ID) {
        const executor = interaction.member as GuildMember;
        if (role.position >= executor.roles.highest.position) {
            return interaction.reply(createErrorV2("You cannot manage this role (it is higher or equal to your highest role).").toPayload({ ephemeral: true }));
        }
    }

    try {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply(createErrorV2("You do not have permission to manage roles.").toPayload({ ephemeral: true }));
        }

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role.id);
            const embed = new V2Embed()
                .setColor(0xED4245)
                .setTitle(`${config.emojis.success} Role Removed`)
                .setDescription(`${config.emojis.dot} **User:** ${targetUser.tag}\n${config.emojis.dot} **Role:** ${role.name}`);
            return interaction.reply(embed.toPayload());
        } else {
            await member.roles.add(role.id);
            const embed = new V2Embed()
                .setColor(0x57F287)
                .setTitle(`${config.emojis.success} Role Added`)
                .setDescription(`${config.emojis.dot} **User:** ${targetUser.tag}\n${config.emojis.dot} **Role:** ${role.name}`);
            return interaction.reply(embed.toPayload());
        }
    } catch (err) {
        console.error(err);
        return interaction.reply(createErrorV2("Failed to manage role.").toPayload({ ephemeral: true }));
    }
}
