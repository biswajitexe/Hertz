
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('botrole')
    .setDescription('Manage bot roles (Owner Only)')
    .addSubcommand(sub =>
        sub.setName('owner')
            .setDescription('Manage Bot Owners')
            .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
            .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('developer')
            .setDescription('Manage Bot Developers')
            .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
            .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('admin')
            .setDescription('Manage Bot Admins')
            .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
            .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('staff')
            .setDescription('Manage Bot Staff')
            .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
            .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('supporter')
            .setDescription('Manage Bot Supporters')
            .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
            .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('noprefix')
            .setDescription('Manage No Prefix Users')
            .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
            .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('premium')
            .setDescription('Manage Premium Users')
            .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
            .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('vip')
            .setDescription('Manage VIP Users')
            .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
            .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true))
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} Only the **Bot Owner** can use this command.`, ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const action = interaction.options.getString('action');
    const targetUser = interaction.options.getUser('user');

    if (!targetUser) return;

    const botConfig = await database.getBotConfig();
    let updated = false;
    let rankName = "";
    let emoji = "";

    // Helper to genericize the add/remove logic
    const handleRole = (list: string[], name: string, icon: string) => {
        rankName = name;
        emoji = icon;
        if (action === 'add') {
            if (!list.includes(targetUser.id)) {
                list.push(targetUser.id);
                updated = true;
                return true; // Added
            }
            return false; // Already exists
        } else {
            if (list.includes(targetUser.id)) {
                const index = list.indexOf(targetUser.id);
                if (index > -1) {
                    list.splice(index, 1);
                    updated = true;
                    return true; // Removed
                }
            }
            return false; // Not found
        }
    };

    let success = false;

    // Dispatch based on subcommand
    switch (subcommand) {
        case 'owner':
             // Initialize generic arrays if undefined (though DB init should handle it)
            if (!botConfig.ownerUsers) botConfig.ownerUsers = [];
            success = handleRole(botConfig.ownerUsers, "Bot Owner", config.emojis.owner);
            break;
        case 'developer':
            if (!botConfig.developerUsers) botConfig.developerUsers = [];
            success = handleRole(botConfig.developerUsers, "Bot Developer", config.emojis.developer);
            break;
        case 'admin':
            if (!botConfig.adminUsers) botConfig.adminUsers = [];
            success = handleRole(botConfig.adminUsers, "Bot Admin", config.emojis.admin);
            break;
        case 'staff':
            if (!botConfig.staffUsers) botConfig.staffUsers = [];
            success = handleRole(botConfig.staffUsers, "Bot Staff", config.emojis.staff);
            break;
        case 'supporter':
            if (!botConfig.supporterUsers) botConfig.supporterUsers = [];
            success = handleRole(botConfig.supporterUsers, "Bot Supporter", config.emojis.supporter);
            break;
        case 'noprefix':
            if (!botConfig.noPrefixUsers) botConfig.noPrefixUsers = [];
            success = handleRole(botConfig.noPrefixUsers, "No Prefix User", config.emojis.noprefix); // Check emoji for no prefix
            if (success && action === 'add') emoji = "<:3852diamond:1466392074189410421>"; // Special override if needed
            break;
        case 'premium':
            if (!botConfig.premiumUsers) botConfig.premiumUsers = [];
            success = handleRole(botConfig.premiumUsers, "Premium User", config.emojis.noprefix); // Premium uses noprefix emoji in old code or custom?
            // In old code: Premium used emojis.noprefix. No Prefix used <:3852diamond...>
            // Let's stick to config emojis where possible.
            rankName = "Premium User";
            emoji = config.emojis.noprefix;
            break;
        case 'vip':
            if (!botConfig.vipUsers) botConfig.vipUsers = [];
            success = handleRole(botConfig.vipUsers, "VIP User", config.emojis.vip);
            break;
    }

    if (updated) {
        await database.updateBotConfig(botConfig);
        if (success) {
            if (action === 'add') {
                await interaction.reply({ content: `${config.emojis.success} Added **${targetUser.username}** to **${rankName}** ${emoji}.` });
            } else {
                await interaction.reply({ content: `${config.emojis.success} Removed **${targetUser.username}** from **${rankName}**.`, allowedMentions: { parse: [] } });
            }
        }
    } else {
        if (action === 'add') {
             await interaction.reply({ content: `${config.emojis.warning} **${targetUser.username}** is already a **${rankName}**.`, ephemeral: true });
        } else {
             await interaction.reply({ content: `${config.emojis.warning} **${targetUser.username}** is not a **${rankName}**.`, ephemeral: true });
        }
    }
}
