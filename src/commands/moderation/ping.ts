import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

export const aliases = ['p', 'latency'];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setTitle('🏓 Pong!')
        .addFields(
            { name: 'Bot Latency', value: `${latency}ms`, inline: true },
            { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
        )
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

    await interaction.editReply({ content: null, ...embed.toPayload() });
}
