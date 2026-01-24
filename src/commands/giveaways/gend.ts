
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { handleEnd } from "./giveaway";

export const command = new SlashCommandBuilder()
    .setName('gend')
    .setDescription('End a giveaway early (Shortcut)')
    .addStringOption(option =>
        option.setName('message_id')
            .setDescription('The message ID of the giveaway')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction) {
    await handleEnd(interaction);
}
