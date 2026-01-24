// Update imports
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../../database";
import * as config from "../../../config";
import { handlePause } from "../giveaway";

export const command = new SlashCommandBuilder()
    .setName('gpause')
    .setDescription('Pause a giveaway')
    .addStringOption(option =>
        option.setName('message_id')
            .setDescription('The message ID')
            .setRequired(true)
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage giveaways.`, ephemeral: true });
    }

    const messageId = interaction.options.getString('message_id');
    if (!messageId) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setDescription(`**Usage:** \`?gpause <message_id>\``);

        return interaction.reply({ embeds: [embed] });
    }

    await handlePause(interaction);
}
