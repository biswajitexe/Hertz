
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('botroles')
    .setDescription('Displays information about special bot roles');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`<:74658vipglow:1465051133704798435> Bot Roles`)
        .setDescription(`**These are the special roles recognized within the Xeon ecosystem.**`)
        .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
        .addFields(
            {
                name: `${config.emojis.owner} Owner`,
                value: "> The creator and absolute controller of the bot. Has access to all commands and bypasses all restrictions.",
                inline: false
            },
            {
                name: `${config.emojis.admin} Admin`,
                value: "> Server Administrators who manage the bot's settings within the guild. Granted via Discord permissions.",
                inline: false
            },
            {
                name: `${config.emojis.staff} Staff`,
                value: "> Special verified users who assist in bot moderation and support. Recognized globally across servers.",
                inline: false
            },
            {
                name: `${config.emojis.noprefix} Premium User`,
                value: "> Supporters who have donated or boosted. They enjoy ad-free experience and premium profile aesthetics.",
                inline: false
            },
            {
                name: `<:z_premium:1385210766457831434> No Prefix`,
                value: "> Users who can use commands without typing the prefix. Granted for testing or partnership.",
                inline: false
            },
            {
                name: `${config.emojis.member || "👤"} Member`,
                value: "> Standard users of the bot. Can use all public commands.",
                inline: false
            }
        )
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}
