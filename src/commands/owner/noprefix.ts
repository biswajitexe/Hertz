import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createWarningV2 } from "../../utilities/componentV2";

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

    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);
    if (botConfig?.developerUsers) owners.push(...botConfig.developerUsers);
    if (botConfig?.adminUsers) owners.push(...botConfig.adminUsers);

    if (!owners.includes(interaction.user.id)) {
        return interaction.reply(createErrorV2('Only the **Bot Owner** can manage No-Prefix users.').toPayload({ ephemeral: true }));
    }

    const subcommand = interaction.options.getSubcommand();

    const embedStyle = (title: string, description: string) => {
        return new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.star} ${title}`)
            .setDescription(description)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
    };

    if (!botConfig.noPrefixUsers) botConfig.noPrefixUsers = [];

    if (subcommand === 'add') {
        const user = interaction.options.getUser('user', true);

        if (botConfig.noPrefixUsers.includes(user.id)) {
            return interaction.reply(createErrorV2(`**${user.tag}** is already in the No-Prefix list.`).toPayload({ ephemeral: true }));
        }

        botConfig.noPrefixUsers.push(user.id);
        await database.updateBotConfig(botConfig);

        const embed = embedStyle('No Prefix Added', `> Added **${user.tag}** to the No-Prefix list.\n> They can now use commands without a prefix globally.\n\n${config.emojis.lock} **Authorization granted.**`);
        return interaction.reply(embed.toPayload());
    }

    if (subcommand === 'remove') {
        const user = interaction.options.getUser('user', true);

        if (!botConfig.noPrefixUsers.includes(user.id)) {
            return interaction.reply(createErrorV2(`**${user.tag}** is not in the No-Prefix list.`).toPayload({ ephemeral: true }));
        }

        botConfig.noPrefixUsers = botConfig.noPrefixUsers.filter(id => id !== user.id);
        await database.updateBotConfig(botConfig);

        const embed = embedStyle('No Prefix Removed', `> Removed **${user.tag}** from the No-Prefix list.`);
        return interaction.reply(embed.toPayload());
    }

    if (subcommand === 'list') {
        const users = botConfig.noPrefixUsers;

        if (users.length === 0) {
            return interaction.reply(createWarningV2('There are no No-Prefix users.').toPayload({ ephemeral: true }));
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
        return interaction.reply(embed.toPayload());
    }

    // Default: Help Menu
    const embed = embedStyle('No Prefix Commands',
        `\`${config.prefix}noprefix add <user>\`\n` +
        `\`${config.prefix}noprefix remove <user>\`\n` +
        `\`${config.prefix}noprefix list\``
    );
    return interaction.reply(embed.toPayload());
}
