
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status')
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Reason for being AFK')
            .setRequired(false)
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    const reason = interaction.options.getString('reason');
    const guildData = await database.retrieveGuild(interaction.guild.id);
    if (!guildData) return interaction.reply({ content: "Database error.", ephemeral: true });

    if (!guildData.afk) guildData.afk = {};

    guildData.afk[interaction.user.id] = {
        reason: reason || "AFK",
        timestamp: Date.now()
    };

    await database.insertGuild(interaction.guild.id, guildData);

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({
            name: `${interaction.user.username} is now AFK`,
            iconURL: interaction.user.displayAvatarURL(),
        });

    if (reason) {
        embed.setDescription(`${config.emojis.dot} **Reason:** ${reason}`);
    }

    // Change nickname? Often bots add [AFK] tag but permission issues are common. Prizon might have done it.
    // I'll skip nickname change to be safe for now, or add it with catch.

    await interaction.reply({ embeds: [embed] });
}
