import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createWarningV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('developer')
    .setDescription('Manage Bot Developers')
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('List all developers'));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);

    // Permission Check: Only Owners
    if (!owners.includes(interaction.user.id)) {
        return interaction.reply(createErrorV2('Only the **Bot Owner** can use this command.').toPayload({ ephemeral: true }));
    }

    const subcommand = interaction.options.getSubcommand(false);
    if (!botConfig.developerUsers) botConfig.developerUsers = [];

    const embedStyle = (title: string, description: string) => {
        return new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.dev} ${title}`)
            .setDescription(description)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
    };

    if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user', true);
        if (botConfig.developerUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is already a **Developer**.`).toPayload());
        }
        botConfig.developerUsers.push(targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('Developer Added', `> Added **${targetUser.tag}** as a **Bot Developer**.\n\n${config.emojis.lock} **Authorization granted.**`).toPayload());
    }

    if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user', true);
        if (!botConfig.developerUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is not a **Developer**.`).toPayload());
        }
        botConfig.developerUsers = botConfig.developerUsers.filter(id => id !== targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('Developer Removed', `> Removed **${targetUser.tag}** from **Bot Developers**.`).toPayload());
    }

    if (subcommand === 'list') {
        const users = botConfig.developerUsers;
        if (users.length === 0) return interaction.reply(createWarningV2('No Developers found.').toPayload());
        
        const names = await Promise.all(users.map(async id => {
            try { return (await interaction.client.users.fetch(id)).username; } catch { return `Unknown (${id})`; }
        }));
        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        return interaction.reply(embedStyle('Bot Developers', list).toPayload());
    }

    // Default: Help Menu
    const embed = embedStyle('Developer Commands',
        `\`${config.prefix}developer add <user>\`\n` +
        `\`${config.prefix}developer remove <user>\`\n` +
        `\`${config.prefix}developer list\``
    );
    return interaction.reply(embed.toPayload());
}
