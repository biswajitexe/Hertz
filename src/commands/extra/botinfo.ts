import { ChatInputCommandInteraction, SlashCommandBuilder, version as djsVersion, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import os from "os";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Display detailed bot information and statistics');

export const aliases = ["bi", "stats"];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const client = interaction.client;

    // Uptime calculation
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime % 60);

    // System Stats
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2); // GB
    const platform = os.platform();
    const nodeVersion = process.version;

    // Bot Stats
    const totalGuilds = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const totalChannels = client.channels.cache.size;

    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setTitle(`${config.emojis.bot} Hey, I'm ${client.user.username}`)
        .setDescription("> Modular, high-performance Discord management system.")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            {
                name: `${config.emojis.info} Identity`,
                value: [
                    `• **Developer:** Vasudev AI Team`,
                    `• **Name:** **${client.user.username}**`,
                    `• **ID:** \`${process.env.CLIENT_ID || client.user.id}\``,
                    `• **Created:** <t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`
                ].join("\n"),
                inline: false
            },
            {
                name: `${config.emojis.stats} Statistics`,
                value: [
                    `• **Servers:** ${totalGuilds.toLocaleString()}`,
                    `• **Users:** ${totalUsers.toLocaleString()}`,
                    `• **Channels:** ${totalChannels.toLocaleString()}`,
                    `• **Ping:** ${client.ws.ping}ms`
                ].join("\n"),
                inline: true
            },
            {
                name: `${config.emojis.settings} System`,
                value: [
                    `• **Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s`,
                    `• **Memory:** ${memoryUsage} MB / ${totalMemory} GB`,
                    `• **Node.js:** ${nodeVersion}`,
                    `• **Library:** v${djsVersion}`
                ].join("\n"),
                inline: true
            }
        )
        .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`)
        .setTimestamp();

    // Buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setLabel("Invite Me")
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`),
        new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL("https://discord.gg/alpha")
    );

    await interaction.reply(embed.toPayload({ extraComponents: [row] }));
}
