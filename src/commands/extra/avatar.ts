import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

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

    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setAuthor(`${user.username}'s Avatar`, user.displayAvatarURL())
        .setImage(user.displayAvatarURL({ size: 4096 }))
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

    await interaction.reply(embed.toPayload());
}
