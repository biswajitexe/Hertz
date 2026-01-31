
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Manage premium access (Owner Only)')
    .addSubcommand(sub => sub
        .setName('add')
        .setDescription('Add premium access')
        .addStringOption(opt => opt.setName('id').setDescription('User or Server ID').setRequired(true))
        .addStringOption(opt => opt.setName('type').setDescription('User or Server?').setRequired(true).addChoices({ name: 'User', value: 'user' }, { name: 'Server', value: 'server' }))
    )
    .addSubcommand(sub => sub
        .setName('remove')
        .setDescription('Remove premium access')
        .addStringOption(opt => opt.setName('id').setDescription('User or Server ID').setRequired(true))
        .addStringOption(opt => opt.setName('type').setDescription('User or Server?').setRequired(true).addChoices({ name: 'User', value: 'user' }, { name: 'Server', value: 'server' }))
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);
    if (botConfig?.adminUsers) owners.push(...botConfig.adminUsers);

    if (!owners.includes(interaction.user.id)) return interaction.reply({ content: `🚫 Unknown command.`, ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const id = interaction.options.getString('id', true);
    const type = interaction.options.getString('type', true);

    const embedStyle = (title: string, description: string, color: number = config.colors.primary) => {
        return new EmbedBuilder()
            .setColor(color)
            .setDescription(`**<:74658vipglow:1465051133704798435> ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (sub === 'add') {
        if (type === 'user') {
            if (botConfig.premiumUsers.includes(id)) return interaction.reply({ embeds: [embedStyle('Premium Error', `> User is already premium.`, config.colors.error)], ephemeral: true });
            botConfig.premiumUsers.push(id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ embeds: [embedStyle('User Added', `> User <@${id}> added to **Premium Users**.`, config.colors.success)], ephemeral: true });
        } else {
            if (botConfig.premiumGuilds.includes(id)) return interaction.reply({ embeds: [embedStyle('Premium Error', `> Server is already premium.`, config.colors.error)], ephemeral: true });
            botConfig.premiumGuilds.push(id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ embeds: [embedStyle('Server Added', `> Server \`${id}\` added to **Premium Servers**.`, config.colors.success)], ephemeral: true });
        }
    }

    if (sub === 'remove') {
        if (type === 'user') {
            botConfig.premiumUsers = botConfig.premiumUsers.filter(u => u !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ embeds: [embedStyle('User Removed', `> User <@${id}> removed from Premium.`, config.colors.success)], ephemeral: true });
        } else {
            botConfig.premiumGuilds = botConfig.premiumGuilds.filter(g => g !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ embeds: [embedStyle('Server Removed', `> Server \`${id}\` removed from Premium.`, config.colors.success)], ephemeral: true });
        }
    }
}
