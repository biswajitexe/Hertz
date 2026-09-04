import { ChatInputCommandInteraction, SlashCommandBuilder, ChannelType, PermissionsBitField } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('servers')
    .setDescription('Manage servers (Owner Only)')
    .addSubcommand(sub => sub.setName('list').setDescription('List top servers by member count'))
    .addSubcommand(sub => sub.setName('leave').setDescription('Force leave a server').addStringOption(opt => opt.setName('id').setDescription('Server ID').setRequired(true)))
    .addSubcommand(sub => sub.setName('invite').setDescription('Generate invite for a server').addStringOption(opt => opt.setName('id').setDescription('Server ID').setRequired(true)));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);

    if (!owners.includes(interaction.user.id)) return interaction.reply(createErrorV2('Unknown command.').toPayload({ ephemeral: true }));

    const sub = interaction.options.getSubcommand();

    const embedStyle = (title: string, description: string, color: number = config.colors.default) => {
        return new V2Embed()
            .setColor(color)
            .setTitle(`${config.emojis.owner} ${title}`)
            .setDescription(description)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
    };

    if (sub === 'list') {
        const guilds = interaction.client.guilds.cache.sort((a, b) => b.memberCount - a.memberCount).first(10);

        const description = guilds.map((g, i) => `> \`${i + 1}.\` **${g.name}** \n> ID: \`${g.id}\` | Members: \`${g.memberCount}\` | Owner: <@${g.ownerId}>`).join('\n\n');

        const embed = embedStyle(`Top 10 Servers (${interaction.client.guilds.cache.size} Total)`, description);

        return interaction.reply(embed.toPayload({ ephemeral: true }));
    }

    if (sub === 'leave') {
        const id = interaction.options.getString('id', true);
        const guild = interaction.client.guilds.cache.get(id);
        if (!guild) return interaction.reply(embedStyle('Server Error', '> Bot is not in that server.', config.colors.error).toPayload({ ephemeral: true }));

        await guild.leave();
        return interaction.reply(embedStyle('Left Server', `> Left **${guild.name}** (\`${id}\`).`, config.colors.success).toPayload({ ephemeral: true }));
    }

    if (sub === 'invite') {
        const id = interaction.options.getString('id', true);
        const guild = interaction.client.guilds.cache.get(id);
        if (!guild) return interaction.reply(embedStyle('Server Error', '> Bot is not in that server.', config.colors.error).toPayload({ ephemeral: true }));

        const channel = guild.channels.cache.find(c =>
            c.type === ChannelType.GuildText &&
            c.permissionsFor(guild.members.me!)?.has(PermissionsBitField.Flags.CreateInstantInvite)
        );

        if (!channel) {
            return interaction.reply(embedStyle('Invite Error', `> Could not find a channel to create invite in **${guild.name}**. Missing permissions?`, config.colors.error).toPayload({ ephemeral: true }));
        }

        try {
            // @ts-ignore - channel is text based
            const invite = await channel.createInvite({ maxAge: 0, maxUses: 1 });
            return interaction.reply(embedStyle(`Invite for ${guild.name}`, `> [Click to Join](${invite.url})`).toPayload({ ephemeral: true }));
        } catch (e) {
            return interaction.reply(embedStyle('Invite Error', '> Failed to create invite.', config.colors.error).toPayload({ ephemeral: true }));
        }
    }
}
