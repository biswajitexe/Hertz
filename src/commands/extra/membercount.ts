
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Display the current member count of the server');

export const aliases = ['mc', 'members'];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    const guild = interaction.guild;

    // Member counts
    const totalMembers = guild.memberCount;
    // Note: Accurate Human/Bot count relies on cache or fetch. 
    // Basic cache filter:
    const humans = guild.members.cache.filter(member => !member.user.bot).size;
    const bots = guild.members.cache.filter(member => member.user.bot).size;

    const embed = new EmbedBuilder()
        .setColor(0x2B2D31)
        .setAuthor({
            name: guild.name,
            iconURL: guild.iconURL() || undefined,
        })
        .setThumbnail(guild.iconURL({ size: 4096 }))
        .setDescription(
            `\n**Member Statistics**\n` +
            `${config.emojis.dot} **Total Members:** ${totalMembers.toLocaleString()}\n` +
            `${config.emojis.dot} **Humans:** ${humans.toLocaleString()}\n` +
            `${config.emojis.dot} **Bots:** ${bots.toLocaleString()}`
        )
        .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
        });

    if (guild.bannerURL()) {
        embed.setImage(guild.bannerURL({ size: 4096 }) as string);
    }

    await interaction.reply({ embeds: [embed] });
}
