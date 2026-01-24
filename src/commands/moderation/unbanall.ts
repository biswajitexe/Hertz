
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('unbanall')
    .setDescription('Unban ALL banned members from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    // Confirmation layer could be added, but for now we execute directly as per "Prizon" style (speed).
    await interaction.reply({ content: `${config.emojis.loading || "🔄"} Fetching bans...`, ephemeral: false });

    try {
        const bans = await interaction.guild.bans.fetch();

        if (bans.size === 0) {
            return interaction.editReply({ content: `${config.emojis.error} There are no banned users to unban.` });
        }

        await interaction.editReply({ content: `${config.emojis.loading || "🔄"} Unbanning **${bans.size}** members... This may take a while.` });

        let count = 0;
        let errors = 0;

        // Process in chunks or parallel? Discord ratelimits are strict on this.
        // We'll do simple iteration with catch to continue on error.
        for (const ban of bans.values()) {
            await interaction.guild.members.unban(ban.user.id, `Unban All by ${interaction.user.tag}`)
                .then(() => count++)
                .catch(() => errors++);
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('Unban All Complete')
            .setDescription(`${config.emojis.success} Successfully unbanned **${count}** members.\n${errors > 0 ? `${config.emojis.warning} Failed to unban **${errors}** members.` : ''}`)
            .setFooter({ text: `Action by ${interaction.user.tag}` });

        await interaction.editReply({ content: null, embeds: [embed] }); // Clear loading content
    } catch (err) {
        console.error(err);
        await interaction.editReply({ content: `${config.emojis.error} An error occurred while fetching or unbanning users.` });
    }
}
