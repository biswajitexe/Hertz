
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

    if (sub === 'user') {
        if (remove) {
            if (!botConfig.blacklistedUsers.includes(id)) {
                return interaction.reply({ content: `${config.emojis.error} User is not blacklisted.`, ephemeral: true });
            }
            botConfig.blacklistedUsers = botConfig.blacklistedUsers.filter(u => u !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ content: `${config.emojis.success} User ${id} removed from blacklist.`, ephemeral: true });
        } else {
            if (botConfig.blacklistedUsers.includes(id)) {
                return interaction.reply({ content: `${config.emojis.error} User is already blacklisted.`, ephemeral: true });
            }
            botConfig.blacklistedUsers.push(id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ content: `${config.emojis.success} User ${id} added to global blacklist.`, ephemeral: true });
        }
    }

    if (sub === 'server') {
        if (remove) {
            if (!botConfig.blacklistedGuilds.includes(id)) {
                return interaction.reply({ content: `${config.emojis.error} Server is not blacklisted.`, ephemeral: true });
            }
            botConfig.blacklistedGuilds = botConfig.blacklistedGuilds.filter(g => g !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply({ content: `${config.emojis.success} Server ${id} removed from blacklist.`, ephemeral: true });
        } else {
            if (botConfig.blacklistedGuilds.includes(id)) {
                return interaction.reply({ content: `${config.emojis.error} Server is already blacklisted.`, ephemeral: true });
            }
            botConfig.blacklistedGuilds.push(id);
            await database.insertBotConfig(botConfig);

            // Force leave if currently in that guild
            const guild = interaction.client.guilds.cache.get(id);
            if (guild) {
                await guild.leave().catch(() => { });
                return interaction.reply({ content: `${config.emojis.success} Server ${id} blacklisted and forced left.`, ephemeral: true });
            }

            return interaction.reply({ content: `${config.emojis.success} Server ${id} added to global blacklist.`, ephemeral: true });
        }
    }
}
