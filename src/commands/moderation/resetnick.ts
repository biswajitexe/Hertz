import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, GuildMember } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

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
        await interaction.reply(createErrorEmbed(interaction.user, "**Please provide a valid User.**").toPayload({ ephemeral: true }));
        return;
    }

    if (!(targetUser instanceof GuildMember)) {
        await interaction.reply(createErrorEmbed(interaction.user, "Target is not a member of this server.").toPayload({ ephemeral: true }));
        return;
    }

    if (!targetUser.manageable) {
        return interaction.reply(createErrorV2("I cannot change this member's nickname (Role hierarchy).").toPayload({ ephemeral: true }));
    }

    try {
        await targetUser.setNickname(null);

        const embed = new V2Embed()
            .setColor(config.colors.success)
            .setTitle(`${config.emojis.success} Nickname Reset`)
            .setDescription(`Reset **${targetUser.user.tag}**'s nickname.`);

        await interaction.reply(embed.toPayload());

    } catch (err) {
        console.error(err);
        return interaction.reply(createErrorV2("Failed to reset nickname.").toPayload({ ephemeral: true }));
    }
}
