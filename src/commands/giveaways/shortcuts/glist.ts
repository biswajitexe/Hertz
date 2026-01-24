
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../../database";
import { handleList } from "../giveaway";

export const command = new SlashCommandBuilder()
    .setName('glist')
    .setDescription('List all active giveaways');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    await handleList(interaction);
}
