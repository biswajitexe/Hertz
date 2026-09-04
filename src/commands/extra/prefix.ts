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

    const embedStyle = (title: string, description: string, color: number = config.colors.default) => {
        return new V2Embed()
            .setColor(color)
            .setTitle(`${config.emojis.pin} ${title}`)
            .setDescription(description)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
    };

    if (sub === 'set') {
        const newPrefix = interaction.options.getString('new_prefix', true);

        if (newPrefix.length > 5) {
            return interaction.reply(embedStyle('Prefix Error', `> ${config.emojis.wrong} Prefix cannot be longer than 5 characters.`, config.colors.default).toPayload({ ephemeral: true }));
        }

        guild.prefix = newPrefix;
        await database.insertGuild(interaction.guildId, guild);

        return interaction.reply(embedStyle('Prefix Updated', `> Successfully set custom server prefix.\n\n• **New Prefix:** \`${newPrefix}\`\n• **Example:** \`${newPrefix}help\``, config.colors.default).toPayload());
    }

    if (sub === 'reset') {
        guild.prefix = null;
        await database.insertGuild(interaction.guildId, guild);
        return interaction.reply(embedStyle('Prefix Reset', `> Reset prefix to default system prefix.\n\n• **Prefix:** \`${config.prefix}\``, config.colors.default).toPayload());
    }

    // Default: Show Current Prefix
    const current = guild.prefix || config.prefix;
    return interaction.reply(embedStyle('Server Prefix', `> Current server prefix configuration.\n\n• **Prefix:** \`${current}\`\n• **Set:** \`${current}prefix set <new>\`\n• **Reset:** \`${current}prefix reset\``).toPayload());
}
