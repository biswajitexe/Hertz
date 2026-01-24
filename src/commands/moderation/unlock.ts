
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, TextChannel, GuildChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current or specified channel')
    .addChannelOption(option => option.setName('channel').setDescription('The channel to unlock (optional)').setRequired(false))
    .addBooleanOption(option => option.setName('visible').setDescription('Make channel visible? (optional)'));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild || !interaction.channel) return;

    const channel = (interaction.options.getChannel('channel') as GuildChannel) || (interaction.channel as GuildChannel);

    if (!channel) return interaction.reply({ content: `${config.emojis.error} Could not resolve channel.`, ephemeral: true });

    // Check if it's a thread, which cannot be locked via permissions like this usually, but we'll try standard permissions
    if (channel.isThread()) {
        return interaction.reply({ content: `${config.emojis.error} Threads cannot be unlocked individually via this command.`, ephemeral: true });
    }

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage channels.`, ephemeral: true });
    }

    // Redundancy Check
    // Locking adds SendMessages to Deny. If it's not in Deny, it's considered unlocked.
    const currentOverwrites = (channel as TextChannel).permissionOverwrites.cache.get(interaction.guild.id);
    if (!currentOverwrites || !currentOverwrites.deny.has(PermissionFlagsBits.SendMessages)) {
        return interaction.reply({ content: `${config.emojis.error} **This channel is already unlocked.**`, ephemeral: true });
    }

    try {
        await (channel as TextChannel).permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: true
        });

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`${config.emojis.success || "🔓"} **Channel Unlocked**`);

        return interaction.reply({ embeds: [embed] });

    } catch (err) {
        console.error(err);
        return interaction.reply({ content: `${config.emojis.error} Failed to manage channel permissions. Check my role permissions.`, ephemeral: true });
    }
}
