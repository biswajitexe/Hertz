import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel, GuildChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current or specified channel')
    .addChannelOption(option => option.setName('channel').setDescription('The channel to unlock (optional)').setRequired(false))
    .addBooleanOption(option => option.setName('visible').setDescription('Make channel visible? (optional)'));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild || !interaction.channel) return;

    const channel = (interaction.options.getChannel('channel') as GuildChannel) || (interaction.channel as GuildChannel);

    if (!channel) return interaction.reply(createErrorV2("Could not resolve channel.").toPayload({ ephemeral: true }));

    if (channel.isThread()) {
        return interaction.reply(createErrorV2("Threads cannot be unlocked individually via this command.").toPayload({ ephemeral: true }));
    }

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2("You do not have permission to manage channels.").toPayload({ ephemeral: true }));
    }

    // Redundancy Check
    const currentOverwrites = (channel as TextChannel).permissionOverwrites.cache.get(interaction.guild.id);
    if (!currentOverwrites || !currentOverwrites.deny.has(PermissionFlagsBits.SendMessages)) {
        return interaction.reply(createErrorV2("**This channel is already unlocked.**").toPayload({ ephemeral: true }));
    }

    try {
        await (channel as TextChannel).permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: true
        });

        const embed = new V2Embed()
            .setColor(0x57F287)
            .setTitle(`${config.emojis.success || "🔓"} Channel Unlocked`)
            .setDescription(`Successfully unlocked **<#${channel.id}>** for regular messages.`);

        return interaction.reply(embed.toPayload());

    } catch (err) {
        console.error(err);
        return interaction.reply(createErrorV2("Failed to manage channel permissions. Check my role permissions.").toPayload({ ephemeral: true }));
    }
}
