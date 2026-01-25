
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionsBitField } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('servers')
    .setDescription('Manage servers (Owner Only)')
    .addSubcommand(sub => sub.setName('list').setDescription('List top servers by member count'))
    .addSubcommand(sub => sub.setName('leave').setDescription('Force leave a server').addStringOption(opt => opt.setName('id').setDescription('Server ID').setRequired(true)))
    .addSubcommand(sub => sub.setName('invite').setDescription('Generate invite for a server').addStringOption(opt => opt.setName('id').setDescription('Server ID').setRequired(true)));

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (interaction.user.id !== process.env.OWNER_ID) return interaction.reply({ content: `🚫 Unknown command.`, ephemeral: true });

    const sub = interaction.options.getSubcommand();

    const embedStyle = (title: string, description: string, color: number = config.colors.primary) => {
        return new EmbedBuilder()
            .setColor(color)
            .setDescription(`**<:74658vipglow:1465051133704798435> ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (sub === 'list') {
        const guilds = interaction.client.guilds.cache.sort((a, b) => b.memberCount - a.memberCount).first(10);

        const description = guilds.map((g, i) => `> \`${i + 1}.\` **${g.name}** \n> ID: \`${g.id}\` | Members: \`${g.memberCount}\` | Owner: <@${g.ownerId}>`).join('\n\n');

        const embed = embedStyle(`Top 10 Servers (${interaction.client.guilds.cache.size} Total)`, description);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'leave') {
        const id = interaction.options.getString('id', true);
        const guild = interaction.client.guilds.cache.get(id);
        if (!guild) return interaction.reply({ embeds: [embedStyle('Server Error', '> Bot is not in that server.', config.colors.error)], ephemeral: true });

        await guild.leave();
        return interaction.reply({ embeds: [embedStyle('Left Server', `> Left **${guild.name}** (\`${id}\`).`, config.colors.success)], ephemeral: true });
    }

    if (sub === 'invite') {
        const id = interaction.options.getString('id', true);
        const guild = interaction.client.guilds.cache.get(id);
        if (!guild) return interaction.reply({ embeds: [embedStyle('Server Error', '> Bot is not in that server.', config.colors.error)], ephemeral: true });

        // Find a Text Channel with CreateInvite permission
        const channel = guild.channels.cache.find(c =>
            c.type === ChannelType.GuildText &&
            c.permissionsFor(guild.members.me!)?.has(PermissionsBitField.Flags.CreateInstantInvite)
        );

        if (!channel) {
            return interaction.reply({ embeds: [embedStyle('Invite Error', `> Could not find a channel to create invite in **${guild.name}**. Missing permissions?`, config.colors.error)], ephemeral: true });
        }

        try {
            // @ts-ignore - channel is text based
            const invite = await channel.createInvite({ maxAge: 0, maxUses: 1 });
            return interaction.reply({ embeds: [embedStyle(`Invite for ${guild.name}`, `> [Click to Join](${invite.url})`)], ephemeral: true });
        } catch (e) {
            return interaction.reply({ embeds: [embedStyle('Invite Error', '> Failed to create invite.', config.colors.error)], ephemeral: true });
        }
    }
}
