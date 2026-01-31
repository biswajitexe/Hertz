
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('supporter')
    .setDescription('Manage Bot Supporters')
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('List all supporters'));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);

    // Permission Check: Owner OR Admin
    const isOwner = owners.includes(interaction.user.id);
    const isAdmin = botConfig?.adminUsers?.includes(interaction.user.id);

    if (!isOwner && !isAdmin) {
        return interaction.reply({ 
            embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} You do not have permission to use this command.`)], 
            ephemeral: true 
        });
    }

    const subcommand = interaction.options.getSubcommand(false);
    if (!botConfig.supporterUsers) botConfig.supporterUsers = [];

    const embedStyle = (title: string, description: string) => {
        return new EmbedBuilder()
            .setColor(config.colors.primary)
            .setDescription(`**${config.emojis.supporter} ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user', true);
        if (botConfig.supporterUsers.includes(targetUser.id)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${targetUser.tag}** is already a **Supporter**.`)] });
        }
        botConfig.supporterUsers.push(targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply({ embeds: [embedStyle('Supporter Added', `> Added **${targetUser.tag}** as a **Bot Supporter**.`)] });
    }

    if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user', true);
        if (!botConfig.supporterUsers.includes(targetUser.id)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${targetUser.tag}** is not a **Supporter**.`)] });
        }
        botConfig.supporterUsers = botConfig.supporterUsers.filter(id => id !== targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply({ embeds: [embedStyle('Supporter Removed', `> Removed **${targetUser.tag}** from **Bot Supporters**.`)] });
    }

    if (subcommand === 'list') {
        const users = botConfig.supporterUsers;
        if (users.length === 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription(`${config.emojis.warning} No Supporters found.`)] });
        
        const names = await Promise.all(users.map(async id => {
            try { return (await interaction.client.users.fetch(id)).username; } catch { return `Unknown (${id})`; }
        }));
        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        return interaction.reply({ embeds: [embedStyle('Bot Supporters', list)] });
    }

    // Default: Help Menu
    const embed = embedStyle('Supporter Commands',
        `\`${config.prefix}supporter add <user>\`\n` +
        `\`${config.prefix}supporter remove <user>\`\n` +
        `\`${config.prefix}supporter list\``
    );
    return interaction.reply({ embeds: [embed] });
}
