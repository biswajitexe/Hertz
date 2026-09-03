import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createWarningV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Manage Bot Admins')
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('List all admins'));

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
    if (!botConfig.adminUsers) botConfig.adminUsers = [];

    const embedStyle = (title: string, description: string) => {
        return new V2Embed()
            .setColor(config.colors.primary)
            .setTitle(`${config.emojis.admin} ${title}`)
            .setDescription(description)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
    };

    if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user', true);
        if (botConfig.adminUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is already an **Admin**.`).toPayload());
        }
        botConfig.adminUsers.push(targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('Admin Added', `> Added **${targetUser.tag}** as a **Bot Admin**.\n\n<:6581lockkey:1461100873479487559> **Authorization granted.**`).toPayload());
    }

    if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user', true);
        if (!botConfig.adminUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is not an **Admin**.`).toPayload());
        }
        botConfig.adminUsers = botConfig.adminUsers.filter(id => id !== targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('Admin Removed', `> Removed **${targetUser.tag}** from **Bot Admins**.`).toPayload());
    }

    if (subcommand === 'list') {
        const users = botConfig.adminUsers;
        if (users.length === 0) return interaction.reply(createWarningV2('No Admins found.').toPayload());
        
        const names = await Promise.all(users.map(async id => {
            try { return (await interaction.client.users.fetch(id)).username; } catch { return `Unknown (${id})`; }
        }));
        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        return interaction.reply(embedStyle('Bot Admins', list).toPayload());
    }

    // Default: Help Menu
    const embed = embedStyle('Admin Commands',
        `\`${config.prefix}admin add <user>\`\n` +
        `\`${config.prefix}admin remove <user>\`\n` +
        `\`${config.prefix}admin list\``
    );
    return interaction.reply(embed.toPayload());
}
