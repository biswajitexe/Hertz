// Update imports to include EmbedBuilder
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../../database";
import * as config from "../../../config";
import { handleStart } from "../giveaway";

export const command = new SlashCommandBuilder()
    .setName('gstart')
    .setDescription('Start a new giveaway')
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
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage giveaways.`, ephemeral: true });
    }

    const time = interaction.options.getString('time');
    const winners = interaction.options.getInteger('winners');
    const prize = interaction.options.getString('prize');

    if (!time || !winners || !prize) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setDescription(`**Usage:** \`?gstart <time> <winners> <prize>\`\n**Example:** \`?gstart 10m 1 Nitro\``);

        return interaction.reply({ embeds: [embed] });
    }

    await handleStart(interaction);
}
