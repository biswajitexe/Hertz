
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reloads the bot (Owner Only)');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `🚫 Unknown command.`, ephemeral: true });
    }

    await interaction.reply({ content: `${config.emojis.success} **Reloading bot logic...** (This may take a moment)`, ephemeral: true });

    // In a real process manager (PM2), we would exit. 
    // internal reload logic depends on structure. 
    // For now we just kill process to let wrapper restart it.
    console.log("[Reload] Triggered by owner. Exiting...");
    process.exit(0);
}
