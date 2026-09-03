import { type ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as config from "../../config";
import type { Database } from "../../database";
import { logAction } from "../../utilities/modLogger";
import { canModerate } from "../../utilities/permission";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

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
        return interaction.reply(createErrorV2("You do not have permission to kick members.").toPayload({ ephemeral: true }));
    }

    if (!user) {
        await interaction.reply(createErrorV2("User not found. Please mention a valid user.").toPayload({ ephemeral: true }));
        return;
    }

    if (!(user instanceof GuildMember)) {
        await interaction.reply(createErrorV2("User is not in the server.").toPayload({ ephemeral: true }));
        return;
    }

    // Safety Checks
    if (user.id === interaction.user.id) {
        await interaction.reply(createErrorV2("**You cannot warnkick yourself.**").toPayload({ ephemeral: true }));
        return;
    }
    if (user.id === interaction.client.user.id) {
        await interaction.reply(createErrorV2("**You cannot warnkick me.**").toPayload({ ephemeral: true }));
        return;
    }
    if (user.id === interaction.guild.ownerId) {
        await interaction.reply(createErrorV2("**You cannot warnkick the server owner.**").toPayload({ ephemeral: true }));
        return;
    }
    if (!user.kickable) {
        await interaction.reply(createErrorV2("**I cannot warnkick this user. My role is likely below theirs.**").toPayload({ ephemeral: true }));
        return;
    }

    if (!canModerate(interaction.member, user, PermissionFlagsBits.KickMembers)) {
        await interaction.reply(createErrorV2("**You cannot warnkick this user due to role hierarchy.**").toPayload({ ephemeral: true }));
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
        const dmEmbed = new V2Embed()
            .setColor(0xFEE75C)
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

        await user.send(dmEmbed.toPayload()).catch(() => {});
    } catch { }

    try {
        await user.kick(reason);

        // Mod Log
        await logAction(interaction.guild, user.user, interaction.user, 'KICK', `(WarnKick) ${reason}`, database);

        const successEmbed = new V2Embed()
            .setColor(config.colors.warning)
            .setTitle(`${config.emojis.success} Warning Kicked ${user.user.tag}`)
            .setDescription(`**User has been kicked with an invite sent to their DMs.**`)
            .setFooter(inviteUrl ? "Invite link sent in DM" : "Could not create invite link (Permissions?)");

        if (reason !== "No reason provided") {
            successEmbed.addFields({ name: 'Reason', value: reason, inline: false });
        }

        await interaction.editReply(successEmbed.toPayload());

    } catch (error) {
        console.error(error);
        await interaction.editReply(createErrorV2("**Failed to kick user.**").toPayload());
    }
}
