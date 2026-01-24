
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('unhideall')
    .setDescription('Unhide all channels in the server')


export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    await interaction.deferReply();

    // Owner Bypass Check (Since standard perm check is handled by Discord for this command usually, but code level check is good practice if defaults are overridden)
    // Actually, setDefaultMemberPermissions handles the UI visibility. But if a user force-runs it (api), we should check.
    // However, for 'Administrator' commands, we might not have a manual check inside. Let's add one to be safe and allow owner bypass.

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to use this command.`, ephemeral: true });
    }

    const channels = interaction.guild.channels.cache.filter(c => c.isTextBased() && c.manageable);
    let count = 0;

    for (const [id, channel] of channels) {
        try {
            await (channel as TextChannel).permissionOverwrites.edit(interaction.guild.id, {
                ViewChannel: true
            });
            count++;
        } catch (err) {
            console.error(`Failed to unhide ${channel.name}`);
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setDescription(`${config.emojis.success || "👁️"} **Unhidden ${count} channels.**`);

    await interaction.editReply({ embeds: [embed] });
}
