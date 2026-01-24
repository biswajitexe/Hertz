
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { handleList } from "./giveaway";

export const command = new SlashCommandBuilder()
    .setName('glist')
    .setDescription('List all active giveaways (Shortcut)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction) {
    await handleList(interaction);
}
