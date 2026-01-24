
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";
import { handleStart } from "./giveaway";

export const command = new SlashCommandBuilder()
    .setName('gstart')
    .setDescription('Start a new giveaway (Shortcut)')
    .addStringOption(option =>
        option.setName('time')
            .setDescription('Duration (e.g. 1m, 1h, 1d)')
            .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('winners')
            .setDescription('Number of winners')
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('prize')
            .setDescription('Prize for the giveaway')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function run(interaction: ChatInputCommandInteraction) {
    await handleStart(interaction);
}
