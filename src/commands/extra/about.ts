import { ChatInputCommandInteraction } from "discord.js";
import { Database } from "../../database";
import { SlashCommandBuilder } from "@discordjs/builders";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('about')
    .setDescription('Information about Hertz bot');

export const aliases = ['info'];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setTitle("Hey, I'm Hertz")
        .setDescription(
            `> Modular, high-performance Discord management system.\n\n` +
            `• **Prefix:** \`${config.prefix}\` | **Slash:** \`/\`\n` +
            `• **Help:** \`${config.prefix}help\``
        )
        .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

    await interaction.reply(embed.toPayload());
}
