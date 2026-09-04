import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createWarningV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('owner')
    .setDescription('Manage Bot Owners')
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('List all owners'));

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
    if (!botConfig.ownerUsers) botConfig.ownerUsers = [];

    const embedStyle = (title: string, description: string) => {
        return new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.owner} ${title}`)
            .setDescription(description)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
    };

    if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user', true);
        if (botConfig.ownerUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is already an **Owner**.`).toPayload());
        }
        botConfig.ownerUsers.push(targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('Owner Added', `> Added **${targetUser.tag}** as a **Bot Owner**.\n\n${config.emojis.lock} **Authorization granted.**`).toPayload());
    }

    if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user', true);
        if (!botConfig.ownerUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is not an **Owner**.`).toPayload());
        }
        botConfig.ownerUsers = botConfig.ownerUsers.filter(id => id !== targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('Owner Removed', `> Removed **${targetUser.tag}** from **Bot Owners**.`).toPayload());
    }

    if (subcommand === 'list') {
        const users = botConfig.ownerUsers;
        if (users.length === 0) return interaction.reply(createWarningV2('No Database Owners found.').toPayload());
        
        const names = await Promise.all(users.map(async id => {
            try { return (await interaction.client.users.fetch(id)).username; } catch { return `Unknown (${id})`; }
        }));
        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        return interaction.reply(embedStyle('Bot Owners', list).toPayload());
    }

    // Default: Help Menu
    const embed = embedStyle('Owner Commands',
        `\`${config.prefix}owner add <user>\`\n` +
        `\`${config.prefix}owner remove <user>\`\n` +
        `\`${config.prefix}owner list\``
    );
    return interaction.reply(embed.toPayload());
}
