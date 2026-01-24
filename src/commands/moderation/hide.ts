
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, TextChannel, GuildChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('hide')
    .setDescription('Hide the current or specified channel')
    .addChannelOption(option => option.setName('channel').setDescription('The channel to hide (optional)').setRequired(false));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild || !interaction.channel) return;

    // Direct Logic (No Subcommands)
    const channel = (interaction.options.getChannel('channel') as GuildChannel) || (interaction.channel as GuildChannel);

    if (!interaction.options.getChannel('channel')) {
        // If no channel specified, we default to current channel BUT if we want to show help
        // actually existing behavior defaults to current channel. 
        // User asked to "fix possibilities". 
        // For hide/unhide, usually ?hide means "hide this channel".
        // Changing that to show help might break quick usage.
        // However, user said "fix this ... jis moderation command me nhi hai sabhi me".
        // Let's interpret: If usage is ?hide <channel>, and argument is optional, ?hide hides current.
        // If I force help on ?hide, it breaks standard behavior.
        // But `?role` required args. `hide` didn't.
        // Let's ONLY add help if I interpret "fix possibilities" as "standardize help".
        // Actually, for commands like ?hide, defaults are good.
        // I will keep default behavior BUT add the embed if they explicitly try to use it wrongly? 
        // No, maybe I should just stick to the requested pattern:
        // "fix this sari posiblitis implement karo jis moderation command me nhi hai sabhi me"
        // referring to the help embed.
        // Valid approach: If they provide NO args, do they want help or action?
        // ?hide -> Hides current. 
        // I will NOT break this. 
        // BUT `?ban` without args -> Help.
        // `?hide` without args -> Action.
        // I will Leave hide/unhide/lock/unlock as is regarding args, 
        // UNLESS the user explicitly wants ?hide to show help. 
        // Given "sari posiblitis", I'll add the embed if they type `?hide help` (not possible with slash arg types easily without text command logic).
        // Wait, standardizing means usage syntax.
        // I will SKIP hide/unhide/lock/unlock for "missing arg = help" change because they have a valid default (current channel).
        // I will ONLY apply it to commands where args are logically required but made optional for help (ban, kick, mute, warn).

        // Wait, I should check `warn.ts` and `timeout.ts`.
    }

    if (!channel) return interaction.reply({ content: `${config.emojis.error} Could not resolve channel.`, ephemeral: true });

    if (channel.isThread()) {
        return interaction.reply({ content: `${config.emojis.error} Threads cannot be hidden individually via this command.`, ephemeral: true });
    }

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage channels.`, ephemeral: true });
    }

    // Redundancy Check
    const currentOverwrites = (channel as TextChannel).permissionOverwrites.cache.get(interaction.guild.id);
    if (currentOverwrites && currentOverwrites.deny.has(PermissionFlagsBits.ViewChannel)) {
        return interaction.reply({ content: `${config.emojis.error} **This channel is already hidden.**`, ephemeral: true });
    }

    try {
        await (channel as TextChannel).permissionOverwrites.edit(interaction.guild.id, {
            ViewChannel: false
        });

        const embed = new EmbedBuilder()
            .setColor(0xED4245)
            .setDescription(`${config.emojis.success || "🙈"} **Channel Hidden**`);

        return interaction.reply({ embeds: [embed] });

    } catch (err) {
        console.error(err);
        return interaction.reply({ content: `${config.emojis.error} Failed to manage channel permissions. Check my role permissions.`, ephemeral: true });
    }
}
