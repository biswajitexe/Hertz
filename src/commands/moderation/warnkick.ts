import { type ChatInputCommandInteraction, EmbedBuilder, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as config from "../../config";
import type { Database } from "../../database";
import { logAction } from "../../utilities/modLogger";
import { canModerate } from "../../utilities/permission";

export const command = new SlashCommandBuilder()
    .setName('warnkick')
    .setDescription('Kick a user but send them an invite to rejoin (Warning Kick).')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user to warnkick.')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('The reason for the kick.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const user = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || "No reason provided";

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to kick members.`, ephemeral: true });
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
        await interaction.reply({ content: `${config.emojis.error} **You cannot warnkick yourself.**`, ephemeral: true });
        return;
    }
    if (user.id === interaction.client.user.id) {
        await interaction.reply({ content: `${config.emojis.error} **You cannot warnkick me.**`, ephemeral: true });
        return;
    }
    if (user.id === interaction.guild.ownerId) {
        await interaction.reply({ content: `${config.emojis.error} **You cannot warnkick the server owner.**`, ephemeral: true });
        return;
    }
    if (!user.kickable) {
        await interaction.reply({ content: `${config.emojis.error} **I cannot warnkick this user. My role is likely below theirs.**`, ephemeral: true });
        return;
    }

    if (!canModerate(interaction.member, user, PermissionFlagsBits.KickMembers)) {
        await interaction.reply({ content: `${config.emojis.error} **You cannot warnkick this user due to role hierarchy.**`, ephemeral: true });
        return;
    }

    await interaction.deferReply();

    // Invite Logic
    let inviteUrl = "";
    try {
        const me = interaction.guild.members.me;
        if (me) {
            const channel = interaction.guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(me).has(PermissionFlagsBits.CreateInstantInvite));
            if (channel) {
                const invite = await interaction.guild.invites.create(channel.id, { maxUses: 1, maxAge: 86400, unique: true, reason: `Warning Kick for ${user.user.tag}` });
                inviteUrl = invite.url;
            }
        }
    } catch (error) {
        console.error("Failed to create invite for Warning Kick:", error);
    }

    // DM the user
    try {
        const dmEmbed = new EmbedBuilder()
            .setColor(0xFEE75C) // Yellow for Warning
            .setTitle(`You have been Warn-Kicked from ${interaction.guild.name}`)
            .setDescription(`**This is a Warning Kick.**\nYou have been removed but are allowed to rejoin. Please adhere to the rules.`)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Moderator', value: interaction.user.tag }
            )
            .setTimestamp();

        if (inviteUrl) {
            dmEmbed.addFields({ name: 'Rejoin Link', value: `[**Click here to Rejoin**](${inviteUrl})` });
        } else {
            dmEmbed.addFields({ name: 'Rejoin', value: 'Please ask a friend for an invite.' });
        }

        await user.send({ embeds: [dmEmbed] });
    } catch { }

    try {
        await user.kick(reason);

        // Mod Log
        await logAction(interaction.guild, user.user, interaction.user, 'KICK', `(WarnKick) ${reason}`, database);

        const successEmbed = new EmbedBuilder()
            .setColor(config.colors.warning) // Warnkick
            .setDescription(`${config.emojis.success} **Warning Kicked ${user.user.tag}**`)
            .setFooter({ text: inviteUrl ? "Invite link sent in DM" : "Could not create invite link (Permissions?)" });

        if (reason !== "No reason provided") {
            successEmbed.addFields({ name: 'Reason', value: reason, inline: false });
        }

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: `${config.emojis.error} **Failed to kick user.**` });
    }
}
