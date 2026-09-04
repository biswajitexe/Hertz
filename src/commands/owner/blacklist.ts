import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

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
    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);
    if (botConfig?.adminUsers) owners.push(...botConfig.adminUsers);

    if (!owners.includes(interaction.user.id)) return interaction.reply(createErrorV2('Unknown command.').toPayload({ ephemeral: true }));

    const sub = interaction.options.getSubcommand();
    const id = interaction.options.getString('id', true);
    const remove = interaction.options.getBoolean('remove') || false;

    const embedStyle = (title: string, description: string, color: number = config.colors.default) => {
        return new V2Embed()
            .setColor(color)
            .setTitle(`${config.emojis.owner} ${title}`)
            .setDescription(description)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
    };

    if (sub === 'user') {
        if (remove) {
            if (!botConfig.blacklistedUsers.includes(id)) {
                return interaction.reply(embedStyle('Blacklist Error', `> User is not blacklisted.`, config.colors.error).toPayload({ ephemeral: true }));
            }
            botConfig.blacklistedUsers = botConfig.blacklistedUsers.filter(u => u !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply(embedStyle('User Removed', `> User \`${id}\` removed from blacklist.`).toPayload({ ephemeral: true }));
        } else {
            if (botConfig.blacklistedUsers.includes(id)) {
                return interaction.reply(embedStyle('Blacklist Error', `> User is already blacklisted.`, config.colors.error).toPayload({ ephemeral: true }));
            }
            botConfig.blacklistedUsers.push(id);
            await database.insertBotConfig(botConfig);
            return interaction.reply(embedStyle('User Blacklisted', `> User \`${id}\` added to global blacklist.`).toPayload({ ephemeral: true }));
        }
    }

    if (sub === 'server') {
        if (remove) {
            if (!botConfig.blacklistedGuilds.includes(id)) {
                return interaction.reply(embedStyle('Blacklist Error', `> Server is not blacklisted.`, config.colors.error).toPayload({ ephemeral: true }));
            }
            botConfig.blacklistedGuilds = botConfig.blacklistedGuilds.filter(g => g !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply(embedStyle('Server Removed', `> Server \`${id}\` removed from blacklist.`).toPayload({ ephemeral: true }));
        } else {
            if (botConfig.blacklistedGuilds.includes(id)) {
                return interaction.reply(embedStyle('Blacklist Error', `> Server is already blacklisted.`, config.colors.error).toPayload({ ephemeral: true }));
            }
            botConfig.blacklistedGuilds.push(id);
            await database.insertBotConfig(botConfig);

            const guild = interaction.client.guilds.cache.get(id);
            if (guild) {
                await guild.leave().catch(() => { });
                return interaction.reply(embedStyle('Server Blacklisted', `> Server \`${id}\` blacklisted and forced left.`).toPayload({ ephemeral: true }));
            }

            return interaction.reply(embedStyle('Server Blacklisted', `> Server \`${id}\` added to global blacklist.`).toPayload({ ephemeral: true }));
        }
    }
}
