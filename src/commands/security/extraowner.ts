
import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('extraowner')
    .setDescription('Manage users with Extra Owner privileges.')
    .addSubcommand(sub => sub
        .setName('add')
        .setDescription('Add a user as an Extra Owner.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to add').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('remove')
        .setDescription('Remove a user from Extra Owners.')
        .addUserOption(opt => opt.setName('user').setDescription('The user to remove').setRequired(true))
    )
    .addSubcommand(sub => sub
        .setName('show')
        .setDescription('Show all Extra Owners.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    // Strict Permission: Only Real Guild Owner
    if (interaction.user.id !== interaction.guild.ownerId) {
        await interaction.reply({ content: `${config.emojis.error} **Only the Server Owner can manage Extra Owners.**`, ephemeral: true });
        return;
    }

    const sub = interaction.options.getSubcommand();
    let guildData = await database.retrieveGuild(interaction.guild.id);
    if (!guildData) {
        await database.defaultGuild(interaction.guild);
        guildData = await database.retrieveGuild(interaction.guild.id);
    }
    if (!guildData) return;

    if (!guildData.extraOwners) guildData.extraOwners = [];

    if (sub === 'add') {
        const user = interaction.options.getUser('user');

        if (!user) {
            await interaction.reply({ content: `${config.emojis.error} **Please specify a user to add.**\nUsage: \`${config.prefix}extraowner add <@user>\``, ephemeral: true });
            return;
        }

        if (guildData.extraOwners.includes(user.id)) {
            await interaction.reply({ content: `${config.emojis.error} **<@${user.id}> is already an Extra Owner.**`, ephemeral: true });
            return;
        }

        guildData.extraOwners.push(user.id);
        await database.insertGuild(interaction.guild.id, guildData);
        await interaction.reply({ content: `${config.emojis.success} **Successfully added <@${user.id}> as an Extra Owner.**` });

    } else if (sub === 'remove') {
        const user = interaction.options.getUser('user');

        if (!user) {
            await interaction.reply({ content: `${config.emojis.error} **Please specify a user to remove.**\nUsage: \`${config.prefix}extraowner remove <@user>\``, ephemeral: true });
            return;
        }

        if (!guildData.extraOwners.includes(user.id)) {
            await interaction.reply({ content: `${config.emojis.error} **<@${user.id}> is not an Extra Owner.**`, ephemeral: true });
            return;
        }

        guildData.extraOwners = guildData.extraOwners.filter(id => id !== user.id);
        await database.insertGuild(interaction.guild.id, guildData);
        await interaction.reply({ content: `${config.emojis.success} **Successfully removed <@${user.id}> from Extra Owners.**` });

    } else if (sub === 'show') {
        const users = guildData.extraOwners;

        const description = users.length > 0
            ? (await Promise.all(users.map(async (id, i) => {
                const user = await interaction.client.users.fetch(id).catch(() => null);
                return `\`「${i + 1}」\` | \`${user ? user.username : 'Unknown'}「${id}」\``;
            }))).join('\n')
            : "**No Extra Owners set.**";

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: 'Extra Owners', iconURL: 'https://cdn.discordapp.com/emojis/1461335586412695645.png' })
            .setDescription(description)

            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    } else {
        // Help Menu
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('Extra Owner Commands')
            .setDescription(
                `\`${config.prefix}extraowner add <user>\`\n` +
                `\`${config.prefix}extraowner remove <user>\`\n` +
                `\`${config.prefix}extraowner show\``
            )
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    }
}
