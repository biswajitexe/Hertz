
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get a user\'s avatar')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to get avatar for')
            .setRequired(false)
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const user = interaction.options.getUser('target') || interaction.user;

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({ name: `${user.username}'s Avatar`, iconURL: user.displayAvatarURL() })
        .setImage(user.displayAvatarURL({ size: 4096 }))
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
}
