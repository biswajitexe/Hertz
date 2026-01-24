
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Get a user\'s banner')
    .addUserOption(option =>
        option.setName('target')
            .setDescription('The user to get banner for')
            .setRequired(false)
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const rawUser = interaction.options.getUser('target') || interaction.user;
    const user = await interaction.client.users.fetch(rawUser.id, { force: true });

    if (!user.bannerURL()) {
        return interaction.reply({ content: `${config.emojis.error} ${user.username} does not have a banner.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({ name: `${user.username}'s Banner`, iconURL: user.displayAvatarURL() })
        .setImage(user.bannerURL({ size: 4096 }) as string)
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.reply({ embeds: [embed] });
}
