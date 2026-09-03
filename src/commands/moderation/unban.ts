import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type { Database } from "../../database";
import * as config from "../../config";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";
import { logAction } from "../../utilities/modLogger";
import { createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server using their ID.')
    .addStringOption(option => option
        .setName('user_id')
        .setDescription('The ID of the user to unban.')
        .setRequired(true)
    )
    .addStringOption(option => option
        .setName('reason')
        .setDescription('Reason for unbanning.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const userId = interaction.options.getString('user_id', true);
    const reason = interaction.options.getString('reason') || "No reason provided";

    if (!userId) {
        return interaction.reply(createErrorEmbed(interaction.user, "**Please provide a valid User ID.**\nUsage: `?unban <user_id> [reason]`").toPayload({ ephemeral: true }));
    }

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2("You do not have permission to unban members.").toPayload({ ephemeral: true }));
    }

    try {
        await interaction.deferReply();
        const bannedUser = await interaction.guild.bans.fetch(userId).catch(() => null);

        if (!bannedUser) {
            await interaction.editReply(createErrorEmbed(interaction.user, "**This user is not currently banned.**").toPayload());
            return;
        }

        await interaction.guild.members.unban(userId, `[Unbanned by ${interaction.user.tag}] ${reason}`);

        // Log Action
        await logAction(interaction.guild, bannedUser.user, interaction.user, 'UNBAN', reason, database);

        const embed = createSuccessEmbed(interaction.user, `**Unbanned ${bannedUser.user.tag}**`)
            .addFields({ name: 'Reason', value: reason, inline: false });

        await interaction.editReply(embed.toPayload());

    } catch (error) {
        console.error(error);
        await interaction.editReply(createErrorEmbed(interaction.user, "**Failed to unban user. ensure ID is correct.**").toPayload());
    }
}
