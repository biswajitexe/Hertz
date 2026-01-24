import { ChatInputCommandInteraction } from "discord.js";
import { Database } from "../../database";
import { SlashCommandBuilder } from "@discordjs/builders";

export const command = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Information about the bot');

export async function run(message: ChatInputCommandInteraction, database: Database) {
    await message.reply("Command is deprecated.");
};
