
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

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
        return interaction.reply({ 
            embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Only the **Bot Owner** can use this command.`)], 
            ephemeral: true 
        });
    }

    const subcommand = interaction.options.getSubcommand(false);
    if (!botConfig.developerUsers) botConfig.developerUsers = [];

    const embedStyle = (title: string, description: string) => {
        return new EmbedBuilder()
            .setColor(config.colors.primary)
            .setDescription(`**${config.emojis.developer} ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user', true);
        if (botConfig.developerUsers.includes(targetUser.id)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${targetUser.tag}** is already a **Developer**.`)] });
        }
        botConfig.developerUsers.push(targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply({ embeds: [embedStyle('Developer Added', `> Added **${targetUser.tag}** as a **Bot Developer**.`)] });
    }

    if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user', true);
        if (!botConfig.developerUsers.includes(targetUser.id)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${targetUser.tag}** is not a **Developer**.`)] });
        }
        botConfig.developerUsers = botConfig.developerUsers.filter(id => id !== targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply({ embeds: [embedStyle('Developer Removed', `> Removed **${targetUser.tag}** from **Bot Developers**.`)] });
    }

    if (subcommand === 'list') {
        const users = botConfig.developerUsers;
        if (users.length === 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription(`${config.emojis.warning} No Developers found.`)] });
        
        const names = await Promise.all(users.map(async id => {
            try { return (await interaction.client.users.fetch(id)).username; } catch { return `Unknown (${id})`; }
        }));
        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        return interaction.reply({ embeds: [embedStyle('Bot Developers', list)] });
    }

    // Default: Help Menu
    const embed = embedStyle('Developer Commands',
        `\`${config.prefix}developer add <user>\`\n` +
        `\`${config.prefix}developer remove <user>\`\n` +
        `\`${config.prefix}developer list\``
    );
    return interaction.reply({ embeds: [embed] });
}
