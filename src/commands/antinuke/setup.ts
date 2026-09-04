import type { ChatInputCommandInteraction } from "discord.js";
import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as config from "../../config";
import type { Database } from "../../database";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('antinuke')
    .setDescription('Configure the Advanced Antinuke System.')
    .addSubcommand(sub => sub
        .setName('enable')
        .setDescription('Enable the Antinuke system.')
    )
    .addSubcommand(sub => sub
        .setName('disable')
        .setDescription('Disable the Antinuke system.')
    )
    .addSubcommand(sub => sub
        .setName('show')
        .setDescription('View current Antinuke configuration.')
    );


export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    let guildData = await database.retrieveGuild(interaction.guild.id);
    if (!guildData) {
        await database.defaultGuild(interaction.guild);
        guildData = await database.retrieveGuild(interaction.guild.id);
    }
    if (!guildData) return;

    if (!guildData.extraOwners) guildData.extraOwners = [];

    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const isExtraOwner = guildData.extraOwners.includes(interaction.user.id);
    const isBotOwner = interaction.user.id === process.env.OWNER_ID;

    // Permission Check: Owner or Extra Owner or Bot Owner
    if (!isOwner && !isExtraOwner && !isBotOwner) {
        await interaction.reply(createErrorV2('Only the Server Owner, Extra Owners, or Bot Owner can manage the Antinuke system.').toPayload({ ephemeral: true }));
        return;
    }

    const sub = interaction.options.getSubcommand();

    const embedStyle = (title: string, description: string) => {
        return new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.antinuke} ${title}`)
            .setDescription(description)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
    };

    if (sub === 'enable') {
        if (guildData.antinuke.enabled) {
            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setDescription(`${config.emojis.wrong} **Antinuke is already enabled!**`)
                .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
            await interaction.reply(embed.toPayload());
            return;
        }

        guildData.antinuke.enabled = true;

        let logChannel = interaction.guild.channels.cache.find(c => c.name === 'hertz-log' && c.type === ChannelType.GuildText);
        if (!logChannel) {
            try {
                logChannel = await interaction.guild.channels.create({
                    name: 'hertz-log',
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel],
                        }
                    ],
                    reason: 'Auto-created for Antinuke Logging'
                });
            } catch (e) {
                console.error(e);
            }
        }

        if (logChannel) {
            guildData.antinuke.logChannelId = logChannel.id;
        }

        await database.insertGuild(interaction.guild.id, guildData);

        const channelMsg = logChannel ? `\n${config.emojis.locked} **Log channel set to:** <#${logChannel.id}>.` : `\n${config.emojis.warning} Could not create 'hertz-log'. Please set logs manually.`;

        const protections = [
            'Anti Ban', 'Anti Kick', 'Anti Prune', 'Anti Unban', 'Anti Bot Add',
            'Anti Role Create', 'Anti Role Delete', 'Anti Role Update',
            'Anti Channel Create', 'Anti Channel Delete',
            'Anti Server Update', 'Anti Vanity URL', 'Anti Webhook Update',
            'Anti Emoji Update', 'Anti Sticker Update', 'Anti Integration',
            'Anti AutoMod Rule', 'Anti Thread Create', 'Anti Thread Delete'
        ].map(p => `> ${config.emojis.switch_on} ${p}`).join('\n');

        const embed = embedStyle('Antinuke Panel', `**Antinuke System Enabled.**\n\n**Active Protections:**\n${protections}\n${channelMsg}\n\n${config.emojis.info} **Note:** Keep my role on top with Admin perms.`);
        await interaction.reply(embed.toPayload());

    } else if (sub === 'disable') {
        guildData.antinuke.enabled = false;
        await database.insertGuild(interaction.guild.id, guildData);

        const protections = [
            'Anti Ban', 'Anti Kick', 'Anti Prune', 'Anti Unban', 'Anti Bot Add',
            'Anti Role Create', 'Anti Role Delete', 'Anti Role Update',
            'Anti Channel Create', 'Anti Channel Delete',
            'Anti Server Update', 'Anti Vanity URL', 'Anti Webhook Update',
            'Anti Emoji Update', 'Anti Sticker Update', 'Anti Integration',
            'Anti AutoMod Rule', 'Anti Thread Create', 'Anti Thread Delete'
        ].map(p => `> ${config.emojis.switch_off} ${p}`).join('\n');

        const embed = embedStyle('Antinuke Panel', `**Antinuke System Disabled.**\n\n**Inactive Protections:**\n${protections}\n\n${config.emojis.warning} **Your server is now vulnerable.**\nUse \`/antinuke enable\` to restore security.`);
        await interaction.reply(embed.toPayload());

    } else if (sub === 'show') {
        const logChannelId = guildData.antinuke.logChannelId;
        const channelMsg = logChannelId ? `\n${config.emojis.locked} **Log Channel:** <#${logChannelId}>` : `\n${config.emojis.warning} Could not find 'hertz-log'. Please set logs manually.`;

        const statusEmoji = guildData.antinuke.enabled ? config.emojis.switch_on : config.emojis.switch_off;
        const protections = [
            'Anti Ban', 'Anti Kick', 'Anti Prune', 'Anti Unban', 'Anti Bot Add',
            'Anti Role Create', 'Anti Role Delete', 'Anti Role Update',
            'Anti Channel Create', 'Anti Channel Delete',
            'Anti Server Update', 'Anti Vanity URL', 'Anti Webhook Update',
            'Anti Emoji Update', 'Anti Sticker Update', 'Anti Integration',
            'Anti AutoMod Rule', 'Anti Thread Create', 'Anti Thread Delete'
        ].map(p => `> ${statusEmoji} ${p}`).join('\n');

        let description = `**Antinuke System ${guildData.antinuke.enabled ? "Enabled" : "Disabled"}.**\n\n**Active Protections:**\n${protections}`;

        if (guildData.antinuke.enabled) {
            description += `\n${channelMsg}\n\n${config.emojis.info} **Note:** Keep my role on top with Admin perms.`;
        } else {
            description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antinuke enable\` to activate security and protect your server! ${config.emojis.lock}`;
        }

        const embed = embedStyle('Antinuke Panel', description);
        await interaction.reply(embed.toPayload());

    } else {
        // Help Menu
        const embed = embedStyle('Antinuke Commands',
            `\`${config.prefix}antinuke enable\`\n` +
            `\`${config.prefix}antinuke disable\`\n` +
            `\`${config.prefix}antinuke show\``
        );

        await interaction.reply(embed.toPayload());
    }
}
