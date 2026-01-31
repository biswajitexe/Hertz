
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Manage Bot Staff')
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('List all staff'));

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
    if (!botConfig.staffUsers) botConfig.staffUsers = [];

    const embedStyle = (title: string, description: string) => {
        return new EmbedBuilder()
            .setColor(config.colors.primary)
            .setDescription(`**${config.emojis.staff} ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user', true);
        if (botConfig.staffUsers.includes(targetUser.id)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${targetUser.tag}** is already **Staff**.`)] });
        }
        botConfig.staffUsers.push(targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply({ embeds: [embedStyle('Staff Added', `> Added **${targetUser.tag}** as **Bot Staff**.`)] });
    }

    if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user', true);
        if (!botConfig.staffUsers.includes(targetUser.id)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${targetUser.tag}** is not **Staff**.`)] });
        }
        botConfig.staffUsers = botConfig.staffUsers.filter(id => id !== targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply({ embeds: [embedStyle('Staff Removed', `> Removed **${targetUser.tag}** from **Bot Staff**.`)] });
    }

    if (subcommand === 'list') {
        const users = botConfig.staffUsers;
        if (users.length === 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription(`${config.emojis.warning} No Staff found.`)] });
        
        const names = await Promise.all(users.map(async id => {
            try { return (await interaction.client.users.fetch(id)).username; } catch { return `Unknown (${id})`; }
        }));
        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        return interaction.reply({ embeds: [embedStyle('Bot Staff', list)] });
    }

    // Default: Help Menu
    const embed = embedStyle('Staff Commands',
        `\`${config.prefix}staff add <user>\`\n` +
        `\`${config.prefix}staff remove <user>\`\n` +
        `\`${config.prefix}staff list\``
    );
    return interaction.reply({ embeds: [embed] });
}
