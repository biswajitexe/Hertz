
import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('manage')
    .setDescription('Manage bot roles (Owner Only)')
    .addSubcommand(sub =>
        sub.setName('premium')
            .setDescription('Manage Premium Users')
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
        sub.setName('noprefix')
            .setDescription('Manage No Prefix Users')
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

    if (subcommand === 'premium') {
        if (action === 'add') {
            if (!botConfig.premiumUsers.includes(targetUser.id)) {
                botConfig.premiumUsers.push(targetUser.id);
                updated = true;
                await interaction.reply({ content: `${config.emojis.success} Added **${targetUser.username}** to **Premium Users** ${config.emojis.noprefix}.` });
            } else {
                await interaction.reply({ content: `${config.emojis.warning} User is already Premium.`, ephemeral: true });
            }
        } else {
            if (botConfig.premiumUsers.includes(targetUser.id)) {
                botConfig.premiumUsers = botConfig.premiumUsers.filter(id => id !== targetUser.id);
                updated = true;
                await interaction.reply({ content: `${config.emojis.success} Removed **${targetUser.username}** from **Premium Users**.` });
            } else {
                await interaction.reply({ content: `${config.emojis.warning} User is not Premium.`, ephemeral: true });
            }
        }
    } else if (subcommand === 'staff') {
        if (!botConfig.staffUsers) botConfig.staffUsers = []; // Safety check

        if (action === 'add') {
            if (!botConfig.staffUsers.includes(targetUser.id)) {
                botConfig.staffUsers.push(targetUser.id);
                updated = true;
                await interaction.reply({ content: `${config.emojis.success} Added **${targetUser.username}** to **Bot Staff** ${config.emojis.staff}.` });
            } else {
                await interaction.reply({ content: `${config.emojis.warning} User is already Staff.`, ephemeral: true });
            }
        } else {
            if (botConfig.staffUsers.includes(targetUser.id)) {
                botConfig.staffUsers = botConfig.staffUsers.filter(id => id !== targetUser.id);
                updated = true;
                await interaction.reply({ content: `${config.emojis.success} Removed **${targetUser.username}** from **Bot Staff**.` });
            } else {
                await interaction.reply({ content: `${config.emojis.warning} User is not Staff.`, ephemeral: true });
            }
        }
    } else if (subcommand === 'noprefix') {
        if (!botConfig.noPrefixUsers) botConfig.noPrefixUsers = [];

        if (action === 'add') {
            if (!botConfig.noPrefixUsers.includes(targetUser.id)) {
                botConfig.noPrefixUsers.push(targetUser.id);
                updated = true;
                await interaction.reply({ content: `${config.emojis.success} Added **${targetUser.username}** to **No Prefix Users**.` });
            } else {
                await interaction.reply({ content: `${config.emojis.warning} User is already No Prefix.`, ephemeral: true });
            }
        } else {
            if (botConfig.noPrefixUsers.includes(targetUser.id)) {
                botConfig.noPrefixUsers = botConfig.noPrefixUsers.filter(id => id !== targetUser.id);
                updated = true;
                await interaction.reply({ content: `${config.emojis.success} Removed **${targetUser.username}** from **No Prefix Users**.` });
            } else {
                await interaction.reply({ content: `${config.emojis.warning} User is not No Prefix.`, ephemeral: true });
            }
        }
    }

    if (updated) {
        await database.updateBotConfig(botConfig);
    }
}
