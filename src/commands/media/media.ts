import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('media')
    .setDescription('Manage media-only channels')
    .addSubcommand(subcommand =>
        subcommand
            .setName('setup')
            .setDescription('Set a channel as media-only')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('The channel to configure')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove media-only restriction')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('The channel to remove restriction from')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('show')
            .setDescription('Show all media-only channels')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2('You do not have permission to manage channels.').toPayload({ ephemeral: true }));
    }

    const sub = interaction.options.getSubcommand(false);
    const guildId = interaction.guildId!;
    let guildData = await database.retrieveGuild(guildId);

    if (!guildData) {
        await database.defaultGuild(interaction.guild);
        guildData = await database.retrieveGuild(guildId);
        if (!guildData) return;
    }

    const embedStyle = (title: string, description: string) => {
        return new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.media} ${title}`)
            .setDescription(description)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
    };

    if (sub === 'setup') {
        const channel = interaction.options.getChannel('channel', true);

        if (guildData.mediaChannels.includes(channel.id)) {
            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setDescription(`> ${config.emojis.wrong} <#${channel.id}> is already configured as a media-only channel.`)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            return interaction.reply(embed.toPayload({ ephemeral: true }));
        }

        guildData.mediaChannels.push(channel.id);
        await database.insertGuild(guildId, guildData);

        const embed = embedStyle('Media Channels', `> Successfully configured <#${channel.id}> as a media-only channel.\n\n• **Note:** Only images and links can be sent here.`);
        return interaction.reply(embed.toPayload());

    } else if (sub === 'remove') {
        const channel = interaction.options.getChannel('channel', true);

        if (!guildData.mediaChannels.includes(channel.id)) {
            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setDescription(`> ${config.emojis.wrong} <#${channel.id}> is not configured as a media-only channel.`)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            return interaction.reply(embed.toPayload({ ephemeral: true }));
        }

        guildData.mediaChannels = guildData.mediaChannels.filter(id => id !== channel.id);
        await database.insertGuild(guildId, guildData);

        const embed = embedStyle('Media Channels', `> Successfully removed the media-only restriction from <#${channel.id}>.`);
        return interaction.reply(embed.toPayload());

    } else if (sub === 'show') {
        if (guildData.mediaChannels.length === 0) {
            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setDescription(`> ${config.emojis.warning} No media-only channels have been configured on this server.`)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            return interaction.reply(embed.toPayload());
        }

        const channelList = guildData.mediaChannels
            .map(id => `• <#${id}>`)
            .join("\n");

        const embed = embedStyle('Configured Media Channels', `> List of all active media channels.\n\n${channelList}\n\n• **Note:** Users with \`Manage Messages\` can bypass restrictions.`);
        return interaction.reply(embed.toPayload());

    } else {
        const embed = embedStyle('Media Channels',
            `> Restrict channels to media and images only.\n\n` +
            `• **Setup:** \`${config.prefix}media setup <#channel>\`\n` +
            `• **Remove:** \`${config.prefix}media remove <#channel>\`\n` +
            `• **Show:** \`${config.prefix}media show\``
        );

        return interaction.reply(embed.toPayload());
    }
}
