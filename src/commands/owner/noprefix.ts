
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

export const aliases = ['np'];

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    // Global Config
    const botConfig = await database.getBotConfig();
    const isBotOwner = interaction.user.id === process.env.OWNER_ID;

    if (!isBotOwner) {
        return interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(`${config.emojis.error} Only the **Bot Owner** can manage No-Prefix users.`)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            ],
            ephemeral: true
        });
    }

    const subcommand = interaction.options.getSubcommand();

    const embedStyle = (title: string, description: string) => {
        return new EmbedBuilder()
            .setColor(config.colors.primary)
            .setDescription(`**<:74658vipglow:1465051133704798435> ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    // Ensure array exists
    if (!botConfig.noPrefixUsers) botConfig.noPrefixUsers = [];

    if (subcommand === 'add') {
        const user = interaction.options.getUser('user', true);

        if (botConfig.noPrefixUsers.includes(user.id)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setDescription(`${config.emojis.error} **${user.tag}** is already in the No-Prefix list.`)
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                ],
                ephemeral: true
            });
        }

        botConfig.noPrefixUsers.push(user.id);
        await database.updateBotConfig(botConfig); // Assuming this method exists or similar logic


        const embed = embedStyle('No Prefix Added', `> Added **${user.tag}** to the No-Prefix list.\n> They can now use commands without a prefix in this server.`);
        return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'remove') {
        const user = interaction.options.getUser('user', true);

        if (!botConfig.noPrefixUsers.includes(user.id)) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setDescription(`${config.emojis.error} **${user.tag}** is not in the No-Prefix list.`)
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                ],
                ephemeral: true
            });
        }

        botConfig.noPrefixUsers = botConfig.noPrefixUsers.filter(id => id !== user.id);
        await database.updateBotConfig(botConfig);

        const embed = embedStyle('No Prefix Removed', `> Removed **${user.tag}** from the No-Prefix list.`);
        return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === 'list') {
        const users = botConfig.noPrefixUsers;

        if (users.length === 0) {
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(config.colors.warning)
                    .setDescription(`${config.emojis.warning} There are no No-Prefix users.`)
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                ],
                ephemeral: true
            });
        }

        const names = await Promise.all(users.map(async id => {
            try {
                const user = await interaction.client.users.fetch(id);
                return user.username;
            } catch {
                return `Unknown (${id})`;
            }
        }));

        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        const embed = embedStyle('No Prefix Users', list);
        return interaction.reply({ embeds: [embed] });
    }

    // Default: Help Menu (if no subcommand matches or is provided)
    const embed = embedStyle('No Prefix Commands',
        `\`${config.prefix}noprefix add <user>\`\n` +
        `\`${config.prefix}noprefix remove <user>\`\n` +
        `\`${config.prefix}noprefix list\``
    );
    return interaction.reply({ embeds: [embed] });
}
