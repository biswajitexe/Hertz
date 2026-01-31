
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reloads the bot (Owner Only)');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);
    if (botConfig?.developerUsers) owners.push(...botConfig.developerUsers);

    if (!owners.includes(interaction.user.id)) {
        return interaction.reply({ content: `🚫 Unknown command.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setDescription(`**<:74658vipglow:1465051133704798435> Reloading Bot**\n\n> **Reloading bot logic...** (This may take a moment)`)
        .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed], ephemeral: true });

    console.log("[Reload] Triggered by owner. Exiting...");
    process.exit(0);
}
