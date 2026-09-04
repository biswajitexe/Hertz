import { ChatInputCommandInteraction, PermissionFlagsBits, GuildMember, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import { canModerate } from "../../utilities/permission";
import * as config from "../../config";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";
import { logAction } from "../../utilities/modLogger";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute (remove timeout) a user.')
    .addUserOption(option => option
        .setName('user')
        .setDescription('The user to unmute.')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('The reason for the unmute.')
    );

export const aliases = ['untm', 'untimeout'];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const user = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || "No reason provided";

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2("You do not have permission to unmute members.").toPayload({ ephemeral: true }));
    }

    if (!user) {
        await interaction.reply(createErrorEmbed(interaction.user, "**Please provide a valid User.**\nUsage: `?unmute <user> [reason]`").toPayload({ ephemeral: true }));
        return;
    }

    if (!(user instanceof GuildMember)) {
        await interaction.reply(createErrorV2("User is not in the server.").toPayload({ ephemeral: true }));
        return;
    }

    // Safety Checks (Standardization)
    if (user.id === interaction.user.id) {
        await interaction.reply(createErrorV2("**You cannot unmute yourself.**").toPayload({ ephemeral: true }));
        return;
    }
    if (!canModerate(interaction.member, user, PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply(createErrorV2("**You cannot moderate this user due to role hierarchy.**").toPayload({ ephemeral: true }));
        return;
    }

    if (!user.isCommunicationDisabled()) {
        await interaction.reply(createErrorV2("**This user is not muted.**").toPayload({ ephemeral: true }));
        return;
    }

    await interaction.deferReply();

    try {
        await user.timeout(null, reason);

        // Mod Log
        await logAction(interaction.guild, user.user, interaction.user, 'UNMUTE', reason, database);

        const successEmbed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.correct} Unmuted ${user.user.tag}`)
            .setDescription(`> Successfully removed mute restriction from **${user.user.tag}**.`);

        if (reason !== "No reason provided") {
            successEmbed.addFields({ name: 'Reason', value: reason, inline: false });
        }

        await interaction.editReply(successEmbed.toPayload());

    } catch (error) {
        console.error(error);
        await interaction.editReply(createErrorV2("**Failed to unmute user.**").toPayload());
    }
}
