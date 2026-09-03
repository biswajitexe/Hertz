import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed } from "../../utilities/componentV2";

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

    if (!guild) return;

    const embedStyle = (title: string, description: string, color: number = config.colors.primary) => {
        return new V2Embed()
            .setColor(color)
            .setTitle(`<:32725firehonkaistarrail:1465068073143894106> ${title}`)
            .setDescription(description)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
    };

    if (sub === 'set') {
        const newPrefix = interaction.options.getString('new_prefix', true);

        if (newPrefix.length > 5) {
            return interaction.reply(embedStyle('Prefix Error', '> Prefix cannot be longer than 5 characters.', config.colors.error).toPayload({ ephemeral: true }));
        }

        guild.prefix = newPrefix;
        await database.insertGuild(interaction.guildId, guild);

        return interaction.reply(embedStyle('Prefix Updated', `> Successfully set custom prefix to **${newPrefix}**\n> Example: \`${newPrefix}help\``, config.colors.success).toPayload());
    }

    if (sub === 'reset') {
        guild.prefix = null;
        await database.insertGuild(interaction.guildId, guild);
        return interaction.reply(embedStyle('Prefix Reset', `> Reset prefix to default: **${config.prefix}**`, config.colors.success).toPayload());
    }

    // Default: Show Current Prefix
    const current = guild.prefix || config.prefix;
    return interaction.reply(embedStyle('Server Prefix', `> Current Prefix: **\`${current}\`**\n\n**Usage:**\n> \`${current}prefix set <new>\`\n> \`${current}prefix reset\``).toPayload());
}
