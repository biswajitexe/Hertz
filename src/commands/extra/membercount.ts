import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Display the current member count of the server');

export const aliases = ['mc', 'members'];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    const guild = interaction.guild;

    const totalMembers = guild.memberCount;
    const humans = guild.members.cache.filter(member => !member.user.bot).size;
    const bots = guild.members.cache.filter(member => member.user.bot).size;

    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setThumbnail(guild.iconURL({ size: 4096 }))
        .setTitle(`Member Statistics`)
        .setDescription(
            `> Real-time member count for **${guild.name}**.\n\n` +
            `• **Total Members:** \`${totalMembers.toLocaleString()}\`\n` +
            `• **Humans:** \`${humans.toLocaleString()}\`\n` +
            `• **Bots:** \`${bots.toLocaleString()}\``
        )
        .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

    if (guild.bannerURL()) {
        embed.setImage(guild.bannerURL({ size: 4096 }) as string);
    }

    await interaction.reply(embed.toPayload());
}
