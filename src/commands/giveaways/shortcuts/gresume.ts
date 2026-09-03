import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Database } from "../../../database";
import * as config from "../../../config";
import { handleResume } from "../giveaway";
import { V2Embed, createErrorV2 } from "../../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('gresume')
    .setDescription('Resume a paused giveaway')
    .addStringOption(option =>
        option.setName('message_id')
            .setDescription('The message ID')
            .setRequired(true)
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2('You do not have permission to manage giveaways.').toPayload({ ephemeral: true }));
    }

    const messageId = interaction.options.getString('message_id');
    if (!messageId) {
        const embed = new V2Embed()
            .setColor(config.colors.primary)
            .setTitle(`${config.emojis.giveaways || "🎉"} Giveaway Resume`)
            .setDescription(`**Usage:** \`?gresume <message_id>\``);

        return interaction.reply(embed.toPayload());
    }

    await handleResume(interaction);
}
