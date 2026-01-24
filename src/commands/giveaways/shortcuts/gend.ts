// Update imports
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../../database";
import * as config from "../../../config";
import { handleEnd } from "../giveaway";

export const command = new SlashCommandBuilder()
    .setName('gend')
    .setDescription('End a giveaway early')
    .addStringOption(option =>
        option.setName('message_id')
            .setDescription('The message ID of the giveaway')
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
            .setDescription(`**Usage:** \`?gend <message_id>\``);

        return interaction.reply({ embeds: [embed] });
    }

    await handleEnd(interaction);
}
