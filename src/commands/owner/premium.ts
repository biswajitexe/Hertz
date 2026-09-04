import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

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

    if (!owners.includes(interaction.user.id)) return interaction.reply(createErrorV2('Unknown command.').toPayload({ ephemeral: true }));

    const sub = interaction.options.getSubcommand();
    const id = interaction.options.getString('id', true);
    const type = interaction.options.getString('type', true);

    const embedStyle = (title: string, description: string, color: number = config.colors.default) => {
        return new V2Embed()
            .setColor(color)
            .setTitle(`${config.emojis.premium} ${title}`)
            .setDescription(description)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
    };

    if (sub === 'add') {
        if (type === 'user') {
            if (botConfig.premiumUsers.includes(id)) return interaction.reply(embedStyle('Premium Error', `> User is already premium.`, config.colors.default).toPayload({ ephemeral: true }));
            botConfig.premiumUsers.push(id);
            await database.insertBotConfig(botConfig);
            return interaction.reply(embedStyle('User Added', `> User <@${id}> added to **Premium Users**.\n\n${config.emojis.lock} **Premium activated.**`, config.colors.default).toPayload({ ephemeral: true }));
        } else {
            if (botConfig.premiumGuilds.includes(id)) return interaction.reply(embedStyle('Premium Error', `> Server is already premium.`, config.colors.default).toPayload({ ephemeral: true }));
            botConfig.premiumGuilds.push(id);
            await database.insertBotConfig(botConfig);
            return interaction.reply(embedStyle('Server Added', `> Server \`${id}\` added to **Premium Servers**.\n\n${config.emojis.lock} **Premium activated.**`, config.colors.default).toPayload({ ephemeral: true }));
        }
    }

    if (sub === 'remove') {
        if (type === 'user') {
            botConfig.premiumUsers = botConfig.premiumUsers.filter(u => u !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply(embedStyle('User Removed', `> User <@${id}> removed from Premium.`, config.colors.success).toPayload({ ephemeral: true }));
        } else {
            botConfig.premiumGuilds = botConfig.premiumGuilds.filter(g => g !== id);
            await database.insertBotConfig(botConfig);
            return interaction.reply(embedStyle('Server Removed', `> Server \`${id}\` removed from Premium.`, config.colors.success).toPayload({ ephemeral: true }));
        }
    }
}
