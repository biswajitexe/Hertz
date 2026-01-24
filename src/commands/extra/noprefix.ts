
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('noprefix')
    .setDescription('Manage No-Prefix users for this server.')
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Add a user to No-Prefix list')
            .addUserOption(option => option.setName('user').setDescription('The user to add').setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove a user from No-Prefix list')
            .addUserOption(option => option.setName('user').setDescription('The user to remove').setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('Show No-Prefix users')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    // Strict Owner Check (As requested: "main isko du") - allowing Server Owner and Extra Owners defined in DB would be ideal, 
    // but for now let's enforce Server Owner or Extra Owners.
    // Fetch Guild Data first
    let guildData = await database.retrieveGuild(interaction.guild.id);
    if (!guildData) return interaction.reply({ content: "Database error.", ephemeral: true });

    const isBotOwner = interaction.user.id === process.env.OWNER_ID;

    if (!isBotOwner) {
        return interaction.reply({
            embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Only the **Bot Owner** can manage No-Prefix users.`)]
            , ephemeral: true
        });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
        const user = interaction.options.getUser('user', true);

        if (guildData.noPrefixUsers.includes(user.id)) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${user.tag}** is already in the No-Prefix list.`)]
                , ephemeral: true
            });
        }

        guildData.noPrefixUsers.push(user.id);
        await database.insertGuild(interaction.guild.id, guildData);

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setAuthor({ name: "No-Prefix Added", iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`${config.emojis.success} Successfully added **${user.tag}** to the No-Prefix list.\n${config.emojis.dot} They can now use commands without a prefix in this server.`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'remove') {
        const user = interaction.options.getUser('user', true);

        if (!guildData.noPrefixUsers.includes(user.id)) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${user.tag}** is not in the No-Prefix list.`)]
                , ephemeral: true
            });
        }

        guildData.noPrefixUsers = guildData.noPrefixUsers.filter(id => id !== user.id);
        await database.insertGuild(interaction.guild.id, guildData);

        const embed = new EmbedBuilder()
            .setColor(config.colors.error) // Red for removal
            .setAuthor({ name: "No-Prefix Removed", iconURL: interaction.user.displayAvatarURL() })
            .setDescription(`${config.emojis.delete} Successfully removed **${user.tag}** from the No-Prefix list.`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'list') {
        const users = guildData.noPrefixUsers;

        if (users.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription(`${config.emojis.warning} There are no No-Prefix users in this server.`)]
                , ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: `No-Prefix Users [${users.length}]`, iconURL: interaction.guild.iconURL() || undefined })
            .setDescription(users.map((id, index) => `${index + 1}. <@${id}> (\`${id}\`)`).join('\n'))
            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() || undefined })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
}
