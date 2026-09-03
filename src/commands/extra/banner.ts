import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

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
        return interaction.reply(createErrorV2(`${user.username} does not have a banner.`).toPayload({ ephemeral: true }));
    }

    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setAuthor(`${user.username}'s Banner`, user.displayAvatarURL())
        .setImage(user.bannerURL({ size: 4096 }) as string)
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

    await interaction.reply(embed.toPayload());
}
