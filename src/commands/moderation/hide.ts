import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel, GuildChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('hide')
    .setDescription('Hide the current or specified channel')
    .addChannelOption(option => option.setName('channel').setDescription('The channel to hide (optional)').setRequired(false));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild || !interaction.channel) return;

    const channel = (interaction.options.getChannel('channel') as GuildChannel) || (interaction.channel as GuildChannel);

    if (!channel) return interaction.reply(createErrorV2("Could not resolve channel.").toPayload({ ephemeral: true }));

    if (channel.isThread()) {
        return interaction.reply(createErrorV2("Threads cannot be hidden individually via this command.").toPayload({ ephemeral: true }));
    }

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2("You do not have permission to manage channels.").toPayload({ ephemeral: true }));
    }

    // Redundancy Check
    const currentOverwrites = (channel as TextChannel).permissionOverwrites.cache.get(interaction.guild.id);
    if (currentOverwrites && currentOverwrites.deny.has(PermissionFlagsBits.ViewChannel)) {
        return interaction.reply(createErrorV2("**This channel is already hidden.**").toPayload({ ephemeral: true }));
    }

    try {
        await (channel as TextChannel).permissionOverwrites.edit(interaction.guild.id, {
            ViewChannel: false
        });

        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.correct} Channel Hidden`)
            .setDescription(`> Successfully hidden channel from everyone.\n\n• **Channel:** <#${channel.id}>`)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

        return interaction.reply(embed.toPayload());

    } catch (err) {
        console.error(err);
        return interaction.reply(createErrorV2("Failed to manage channel permissions. Check my role permissions.").toPayload({ ephemeral: true }));
    }
}
