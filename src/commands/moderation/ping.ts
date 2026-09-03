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
    const start = Date.now();
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent?.createdTimestamp ? Math.max(1, sent.createdTimestamp - (interaction.createdTimestamp || start)) : Math.max(1, Date.now() - start);

    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setTitle('Pong!')
        .addFields(
            { name: 'Bot Latency', value: `${latency}ms`, inline: true },
            { name: 'API Latency', value: `${wsPing}ms`, inline: true }
        )
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());

    await interaction.editReply(embed.toPayload());
}
