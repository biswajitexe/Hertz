
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { handleReroll } from "./giveaway";

export const command = new SlashCommandBuilder()
    .setName('greroll')
    .setDescription('Reroll a giveaway winner (Shortcut)')
    .addStringOption(option =>
        option.setName('message_id')
            .setDescription('The message ID of the giveaway')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction) {
    await handleReroll(interaction);
}
