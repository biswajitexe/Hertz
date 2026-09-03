import { ChatInputCommandInteraction, SlashCommandBuilder, version as djsVersion, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import os from "os";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Display detailed bot information and statistics');

export const aliases = ["bi", "stats", "about"];

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
        .setColor(config.colors.primary)
        .setTitle(`<:iconfolder:1458160174815514670> About ${client.user.username}`)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
            {
                name: "Identity",
                value: [
                    `${config.emojis.dot} **Developer:** Vasudev AI Team`,
                    `${config.emojis.dot} **Name:** **${client.user.username}**`,
                    `${config.emojis.dot} **ID:** \`${process.env.CLIENT_ID || client.user.id}\``,
                    `${config.emojis.dot} **Created:** <t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`
                ].join("\n"),
                inline: false
            },
            {
                name: "Statistics",
                value: [
                    `${config.emojis.dot} **Servers:** ${totalGuilds.toLocaleString()}`,
                    `${config.emojis.dot} **Users:** ${totalUsers.toLocaleString()}`,
                    `${config.emojis.dot} **Channels:** ${totalChannels.toLocaleString()}`,
                    `${config.emojis.dot} **Ping:** ${client.ws.ping}ms`
                ].join("\n"),
                inline: true
            },
            {
                name: "System",
                value: [
                    `${config.emojis.dot} **Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s`,
                    `${config.emojis.dot} **Memory:** ${memoryUsage} MB / ${totalMemory} GB`,
                    `${config.emojis.dot} **Node.js:** ${nodeVersion}`,
                    `${config.emojis.dot} **Library:** v${djsVersion}`
                ].join("\n"),
                inline: true
            }
        )
        .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL())
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
