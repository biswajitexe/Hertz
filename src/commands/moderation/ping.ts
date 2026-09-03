import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

export const aliases = ['p', 'latency'];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const wsPing = Math.round(interaction.client.ws.ping) || 0;
    const now = Date.now();
    const latency = interaction.createdTimestamp ? Math.max(1, now - interaction.createdTimestamp) : 1;

    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setTitle('Pong!')
        .addFields(
            { name: 'Bot Latency', value: `${latency}ms`, inline: true },
            { name: 'API Latency', value: `${wsPing}ms`, inline: true }
        )
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL())
        .setTimestamp();

    await interaction.reply(embed.toPayload());
}
