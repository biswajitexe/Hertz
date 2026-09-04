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
        .setColor(config.colors.default)
        .setTitle('Pong!')
        .setDescription(`> Real-time system and websocket latency.\n\n• **Bot Latency:** \`${latency}ms\`\n• **API Latency:** \`${wsPing}ms\``)
        .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

    await interaction.reply(embed.toPayload());
}
