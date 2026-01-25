
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Manage global blacklists (Owner Only)')
    .addSubcommand(sub => sub
        .setName('user')
        .setDescription('Blacklist a user')
        .addStringOption(opt => opt.setName('id').setDescription('User ID').setRequired(true))
        .addBooleanOption(opt => opt.setName('remove').setDescription('Remove from blacklist? (Default: false)'))
    )
    .addSubcommand(sub => sub
        .setName('server')
        .setDescription('Blacklist a server')
        .addStringOption(opt => opt.setName('id').setDescription('Server ID').setRequired(true))
        .addBooleanOption(opt => opt.setName('remove').setDescription('Remove from blacklist? (Default: false)'))
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (interaction.user.id !== process.env.OWNER_ID) return interaction.reply({ content: `🚫 Unknown command.`, ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const id = interaction.options.getString('id', true);
    const remove = interaction.options.getBoolean('remove') || false;

    let botConfig = await database.getBotConfig();

    const embedStyle = (title: string, description: string, color: number = config.colors.primary) => {
        return new EmbedBuilder()
            .setColor(color)
            .setDescription(`**<:74658vipglow:1465051133704798435> ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (sub === 'user') {
        if (remove) {
            if (!botConfig.blacklistedUsers.includes(id)) {
                return interaction.reply({ embeds: [embedStyle('Blacklist Error', `> User is not blacklisted.`, config.colors.error)], ephemeral: true });
            }
            botConfig.blacklistedUsers = botConfig.blacklistedUsers.filter(u => u !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ embeds: [embedStyle('User Removed', `> User \`${id}\` removed from blacklist.`)], ephemeral: true });
        } else {
            if (botConfig.blacklistedUsers.includes(id)) {
                return interaction.reply({ embeds: [embedStyle('Blacklist Error', `> User is already blacklisted.`, config.colors.error)], ephemeral: true });
            }
            botConfig.blacklistedUsers.push(id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ embeds: [embedStyle('User Blacklisted', `> User \`${id}\` added to global blacklist.`)], ephemeral: true });
        }
    }

    if (sub === 'server') {
        if (remove) {
            if (!botConfig.blacklistedGuilds.includes(id)) {
                return interaction.reply({ embeds: [embedStyle('Blacklist Error', `> Server is not blacklisted.`, config.colors.error)], ephemeral: true });
            }
            botConfig.blacklistedGuilds = botConfig.blacklistedGuilds.filter(g => g !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ embeds: [embedStyle('Server Removed', `> Server \`${id}\` removed from blacklist.`)], ephemeral: true });
        } else {
            if (botConfig.blacklistedGuilds.includes(id)) {
                return interaction.reply({ embeds: [embedStyle('Blacklist Error', `> Server is already blacklisted.`, config.colors.error)], ephemeral: true });
            }
            botConfig.blacklistedGuilds.push(id);
            await database.insertBotConfig(botConfig);

            // Force leave if currently in that guild
            const guild = interaction.client.guilds.cache.get(id);
            if (guild) {
                await guild.leave().catch(() => { });
                return interaction.reply({ embeds: [embedStyle('Server Blacklisted', `> Server \`${id}\` blacklisted and forced left.`)], ephemeral: true });
            }

            return interaction.reply({ embeds: [embedStyle('Server Blacklisted', `> Server \`${id}\` added to global blacklist.`)], ephemeral: true });
        }
    }
}
