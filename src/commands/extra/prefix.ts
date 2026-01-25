import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('Manage custom prefix for this server.')
    .addSubcommand(subcommand =>
        subcommand
            .setName('set')
            .setDescription('Set a custom prefix')
            .addStringOption(option => option.setName('new_prefix').setDescription('The new prefix to set').setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('reset')
            .setDescription('Reset prefix to default')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const sub = interaction.options.getSubcommand();
    const guild = await database.retrieveGuild(interaction.guildId);

    if (!guild) return; // Should not happen

    const embedStyle = (title: string, description: string, color: number = config.colors.primary) => {
        return new EmbedBuilder()
            .setColor(color)
            .setDescription(`**<:32725firehonkaistarrail:1465068073143894106> ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (sub === 'set') {
        const newPrefix = interaction.options.getString('new_prefix', true);

        if (newPrefix.length > 5) {
            return interaction.reply({ embeds: [embedStyle('Prefix Error', '> Prefix cannot be longer than 5 characters.', config.colors.error)], ephemeral: true });
        }

        guild.prefix = newPrefix;
        await database.insertGuild(interaction.guildId, guild);

        return interaction.reply({ embeds: [embedStyle('Prefix Updated', `> Successfully set custom prefix to **${newPrefix}**\n> Example: \`${newPrefix}help\``, config.colors.success)] });
    }

    if (sub === 'reset') {
        guild.prefix = null;
        await database.insertGuild(interaction.guildId, guild);
        return interaction.reply({ embeds: [embedStyle('Prefix Reset', `> Reset prefix to default: **${config.prefix}**`, config.colors.success)] });
    }

    // Default: Show Current Prefix
    const current = guild.prefix || config.prefix;
    return interaction.reply({ embeds: [embedStyle('Server Prefix', `> Current Prefix: **\`${current}\`**\n\n**Usage:**\n> \`${current}prefix set <new>\`\n> \`${current}prefix reset\``)] });
}
