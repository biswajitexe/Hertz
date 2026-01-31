
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

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
        return interaction.reply({ 
            embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Only the **Bot Owner** can use this command.`)], 
            ephemeral: true 
        });
    }

    const subcommand = interaction.options.getSubcommand(false);
    if (!botConfig.adminUsers) botConfig.adminUsers = [];

    const embedStyle = (title: string, description: string) => {
        return new EmbedBuilder()
            .setColor(config.colors.primary)
            .setDescription(`**${config.emojis.admin} ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user', true);
        if (botConfig.adminUsers.includes(targetUser.id)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${targetUser.tag}** is already an **Admin**.`)] });
        }
        botConfig.adminUsers.push(targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply({ embeds: [embedStyle('Admin Added', `> Added **${targetUser.tag}** as a **Bot Admin**.`)] });
    }

    if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user', true);
        if (!botConfig.adminUsers.includes(targetUser.id)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${targetUser.tag}** is not an **Admin**.`)] });
        }
        botConfig.adminUsers = botConfig.adminUsers.filter(id => id !== targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply({ embeds: [embedStyle('Admin Removed', `> Removed **${targetUser.tag}** from **Bot Admins**.`)] });
    }

    if (subcommand === 'list') {
        const users = botConfig.adminUsers;
        if (users.length === 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription(`${config.emojis.warning} No Admins found.`)] });
        
        const names = await Promise.all(users.map(async id => {
            try { return (await interaction.client.users.fetch(id)).username; } catch { return `Unknown (${id})`; }
        }));
        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        return interaction.reply({ embeds: [embedStyle('Bot Admins', list)] });
    }

    // Default: Help Menu
    const embed = embedStyle('Admin Commands',
        `\`${config.prefix}admin add <user>\`\n` +
        `\`${config.prefix}admin remove <user>\`\n` +
        `\`${config.prefix}admin list\``
    );
    return interaction.reply({ embeds: [embed] });
}
