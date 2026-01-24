import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import * as config from "../../config";
import { logAction } from "../../utilities/modLogger";

export const command = new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Kick a user and delete their messages (Soft Ban)')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user to softban.')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for the softban.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const user = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || "No reason provided";

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to ban members.`, ephemeral: true });
    }

    if (!user) {
        await interaction.reply({ content: `${config.emojis.error} User not found. Please mention a valid user.`, ephemeral: true });
        return;
    }

    if (!(user instanceof GuildMember)) {
        await interaction.reply({ content: `${config.emojis.error} User is not in the server.`, ephemeral: true });
        return;
    }

    // Safety Checks
    if (user.id === interaction.user.id) {
        await interaction.reply({ content: `${config.emojis.error} **You cannot softban yourself.**`, ephemeral: true });
        return;
    }
    if (user.id === interaction.client.user.id) {
        await interaction.reply({ content: `${config.emojis.error} **You cannot softban me.**`, ephemeral: true });
        return;
    }
    if (user.id === interaction.guild.ownerId) {
        await interaction.reply({ content: `${config.emojis.error} **You cannot softban the server owner.**`, ephemeral: true });
        return;
    }
    if (!user.bannable) {
        await interaction.reply({ content: `${config.emojis.error} **I cannot softban this user (My role is too low).**`, ephemeral: true });
        return;
    }

    if (!canModerate(interaction.member, user, PermissionFlagsBits.BanMembers)) {
        await interaction.reply({ content: `${config.emojis.error} **You cannot moderate this user.**`, ephemeral: true });
        return;
    }

    await interaction.deferReply();

    try {
        // 1. Ban with Delete History (7 Days)
        await user.ban({ reason: `[Soft Ban] ${reason}`, deleteMessageSeconds: 7 * 24 * 60 * 60 });

        // 2. Unban immediately
        await interaction.guild.members.unban(user.id, `Soft Ban Completed (Unbanning)`);

        // 3. Log
        await logAction(interaction.guild, user.user, interaction.user, 'BAN', `(Soft Ban) ${reason}`, database);

        const embed = new EmbedBuilder()
            .setColor(config.colors.warning) // Softban is lighter than Ban
            .setDescription(`${config.emojis.success} **Soft Banned ${user.user.tag}**`)
            .addFields(
                { name: 'Action', value: 'Kicked + Messages Deleted (7 Days)', inline: false }
            );

        if (reason !== "No reason provided") {
            embed.addFields({ name: 'Reason', value: reason, inline: false });
        }

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: `${config.emojis.error} **Failed to softban user.**` });
    }
}
