import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, GuildMember } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";

export const command = new SlashCommandBuilder()
    .setName('resetnick')
    .setDescription('Reset a member\'s nickname to their username')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The member to reset nickname for')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const targetUser = interaction.options.getMember('user');

    if (!targetUser) {
        // Should not happen due to setRequired(true), but safety check
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**Please provide a valid User.**")], ephemeral: true });
        return;
    }

    if (!(targetUser instanceof GuildMember)) {
        await interaction.reply({ embeds: [createErrorEmbed(interaction.user, "Target is not a member of this server.")], ephemeral: true });
        return;
    }

    // Permission Check (Already handled by setDefaultMemberPermissions, but good for redundancy or custom logic if needed)
    // if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageNicknames)) ...

    if (!targetUser.manageable) {
        return interaction.reply({ content: `${config.emojis.error} I cannot change this member's nickname (Role hierarchy).`, ephemeral: true });
    }

    try {
        await targetUser.setNickname(null);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`${config.emojis.success} Reset **${targetUser.user.tag}**'s nickname.`);

        await interaction.reply({ embeds: [embed] });

    } catch (err) {
        console.error(err);
        return interaction.reply({ content: `${config.emojis.error} Failed to reset nickname.`, ephemeral: true });
    }
}
