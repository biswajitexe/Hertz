
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { handlePause } from "./giveaway";

export const command = new SlashCommandBuilder()
    .setName('gpause')
    .setDescription('Pause a giveaway (Shortcut)')
    .addStringOption(option =>
        option.setName('message_id')
            .setDescription('The message ID')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction) {
    await handlePause(interaction);
}
