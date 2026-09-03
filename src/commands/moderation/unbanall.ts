import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('unbanall')
    .setDescription('Unban ALL banned members from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    await interaction.reply({ content: `${config.emojis.loading || "🔄"} Fetching bans...`, ephemeral: false });

    try {
        const bans = await interaction.guild.bans.fetch();

        if (bans.size === 0) {
            return interaction.editReply(createErrorV2("There are no banned users to unban.").toPayload());
        }

        await interaction.editReply({ content: `${config.emojis.loading || "🔄"} Unbanning **${bans.size}** members... This may take a while.` });

        let count = 0;
        let errors = 0;

        for (const ban of bans.values()) {
            await interaction.guild.members.unban(ban.user.id, `Unban All by ${interaction.user.tag}`)
                .then(() => count++)
                .catch(() => errors++);
        }

        const embed = new V2Embed()
            .setColor(config.colors.success)
            .setTitle('Unban All Complete')
            .setDescription(`${config.emojis.success} Successfully unbanned **${count}** members.\n${errors > 0 ? `${config.emojis.warning} Failed to unban **${errors}** members.` : ''}`)
            .setFooter(`Action by ${interaction.user.tag}`);

        await interaction.editReply({ content: null, ...embed.toPayload() });
    } catch (err) {
        console.error(err);
        await interaction.editReply(createErrorV2("An error occurred while fetching or unbanning users.").toPayload());
    }
}
