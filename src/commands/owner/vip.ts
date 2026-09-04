import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createWarningV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('vip')
    .setDescription('Manage VIP Users')
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('List all VIPs'));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);

    // Permission Check: Owner OR Admin
    const isOwner = owners.includes(interaction.user.id);
    const isAdmin = botConfig?.adminUsers?.includes(interaction.user.id);

    if (!isOwner && !isAdmin) {
        return interaction.reply(createErrorV2('You do not have permission to use this command.').toPayload({ ephemeral: true }));
    }

    const subcommand = interaction.options.getSubcommand(false);
    if (!botConfig.vipUsers) botConfig.vipUsers = [];

    const embedStyle = (title: string, description: string) => {
        return new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.vip} ${title}`)
            .setDescription(description)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
    };

    if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user', true);
        if (botConfig.vipUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is already a **VIP**.`).toPayload());
        }
        botConfig.vipUsers.push(targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('VIP Added', `> Added **${targetUser.tag}** as a **VIP User**.\n\n${config.emojis.lock} **Authorization granted.**`).toPayload());
    }

    if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user', true);
        if (!botConfig.vipUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is not a **VIP**.`).toPayload());
        }
        botConfig.vipUsers = botConfig.vipUsers.filter(id => id !== targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('VIP Removed', `> Removed **${targetUser.tag}** from **VIP Users**.`).toPayload());
    }

    if (subcommand === 'list') {
        const users = botConfig.vipUsers;
        if (users.length === 0) return interaction.reply(createWarningV2('No VIPs found.').toPayload());
        
        const names = await Promise.all(users.map(async id => {
            try { return (await interaction.client.users.fetch(id)).username; } catch { return `Unknown (${id})`; }
        }));
        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        return interaction.reply(embedStyle('VIP Users', list).toPayload());
    }

    // Default: Help Menu
    const embed = embedStyle('VIP Commands',
        `\`${config.prefix}vip add <user>\`\n` +
        `\`${config.prefix}vip remove <user>\`\n` +
        `\`${config.prefix}vip list\``
    );
    return interaction.reply(embed.toPayload());
}
