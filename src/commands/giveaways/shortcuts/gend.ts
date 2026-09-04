import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Database } from "../../../database";
import * as config from "../../../config";
import { handleEnd } from "../giveaway";
import { V2Embed, createErrorV2 } from "../../../utilities/componentV2";

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
        return interaction.reply(createErrorV2('You do not have permission to manage giveaways.').toPayload({ ephemeral: true }));
    }

    const messageId = interaction.options.getString('message_id');
    if (!messageId) {
        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.giveaways || "🎉"} End Giveaway`)
            .setDescription(`> Immediately conclude an active giveaway.\n\n• **Usage:** \`?gend <message_id>\``)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

        return interaction.reply(embed.toPayload());
    }

    await handleEnd(interaction);
}
