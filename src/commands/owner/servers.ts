
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

    if (sub === 'list') {
        const guilds = interaction.client.guilds.cache.sort((a, b) => b.memberCount - a.memberCount).first(10);

        const description = guilds.map((g, i) => `\`${i + 1}.\` **${g.name}** \nID: \`${g.id}\` | Members: \`${g.memberCount}\` | Owner: <@${g.ownerId}>`).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`Top 10 Servers (${interaction.client.guilds.cache.size} Total)`)
            .setDescription(description);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'leave') {
        const id = interaction.options.getString('id', true);
        const guild = interaction.client.guilds.cache.get(id);
        if (!guild) return interaction.reply({ content: `${config.emojis.error} Bot is not in that server.`, ephemeral: true });

        await guild.leave();
        return interaction.reply({ content: `${config.emojis.success} Left **${guild.name}** (${id}).`, ephemeral: true });
    }

    if (sub === 'invite') {
        const id = interaction.options.getString('id', true);
        const guild = interaction.client.guilds.cache.get(id);
        if (!guild) return interaction.reply({ content: `${config.emojis.error} Bot is not in that server.`, ephemeral: true });

        // Find a Text Channel with CreateInvite permission
        const channel = guild.channels.cache.find(c =>
            c.type === ChannelType.GuildText &&
            c.permissionsFor(guild.members.me!)?.has(PermissionsBitField.Flags.CreateInstantInvite)
        );

        if (!channel) {
            return interaction.reply({ content: `${config.emojis.error} Could not find a channel to create invite in **${guild.name}**. Missing permissions?`, ephemeral: true });
        }

        try {
            // @ts-ignore - channel is text based
            const invite = await channel.createInvite({ maxAge: 0, maxUses: 1 });
            return interaction.reply({ content: `**Invite for ${guild.name}:**\n${invite.url}`, ephemeral: true });
        } catch (e) {
            return interaction.reply({ content: `${config.emojis.error} Failed to create invite.`, ephemeral: true });
        }
    }
}
