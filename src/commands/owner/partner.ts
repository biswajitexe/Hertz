import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createWarningV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('partner')
    .setDescription('Manage Bot Partners')
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('List all partners'));

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
    if (!botConfig.partnerUsers) botConfig.partnerUsers = [];

    const embedStyle = (title: string, description: string) => {
        return new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.verified} ${title}`)
            .setDescription(description)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
    };

    if (subcommand === 'add') {
        const targetUser = interaction.options.getUser('user', true);
        if (botConfig.partnerUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is already a **Partner**.`).toPayload());
        }
        botConfig.partnerUsers.push(targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('Partner Added', `> Added **${targetUser.tag}** as a **Bot Partner**.\n\n${config.emojis.lock} **Authorization granted.**`).toPayload());
    }

    if (subcommand === 'remove') {
        const targetUser = interaction.options.getUser('user', true);
        if (!botConfig.partnerUsers.includes(targetUser.id)) {
            return interaction.reply(createErrorV2(`**${targetUser.tag}** is not a **Partner**.`).toPayload());
        }
        botConfig.partnerUsers = botConfig.partnerUsers.filter(id => id !== targetUser.id);
        await database.updateBotConfig(botConfig);
        return interaction.reply(embedStyle('Partner Removed', `> Removed **${targetUser.tag}** from **Bot Partners**.`).toPayload());
    }

    if (subcommand === 'list') {
        const users = botConfig.partnerUsers;
        if (users.length === 0) return interaction.reply(createWarningV2('No Partners found.').toPayload());
        
        const names = await Promise.all(users.map(async id => {
            try { return (await interaction.client.users.fetch(id)).username; } catch { return `Unknown (${id})`; }
        }));
        const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
        return interaction.reply(embedStyle('Bot Partners', list).toPayload());
    }

    // Default: Help Menu
    const embed = embedStyle('Partner Commands',
        `\`${config.prefix}partner add <user>\`\n` +
        `\`${config.prefix}partner remove <user>\`\n` +
        `\`${config.prefix}partner list\``
    );
    return interaction.reply(embed.toPayload());
}
