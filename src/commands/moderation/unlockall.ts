
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('unlockall')
    .setDescription('Unlock all channels in the server')


export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    await interaction.deferReply();

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to use this command.`, ephemeral: true });
    }

    const channels = interaction.guild.channels.cache.filter(c => c.isTextBased() && c.manageable);
    let count = 0;

    for (const [id, channel] of channels) {
        try {
            await (channel as TextChannel).permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: true
            });
            count++;
        } catch (err) {
            console.error(`Failed to unlock ${channel.name}`);
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setDescription(`${config.emojis.success || "🔓"} **Unlocked ${count} channels.**`);

    await interaction.editReply({ embeds: [embed] });
}
