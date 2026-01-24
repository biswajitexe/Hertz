
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { handleResume } from "./giveaway";

export const command = new SlashCommandBuilder()
    .setName('gresume')
    .setDescription('Resume a paused giveaway (Shortcut)')
    .addStringOption(option =>
        option.setName('message_id')
            .setDescription('The message ID')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction) {
    await handleResume(interaction);
}
