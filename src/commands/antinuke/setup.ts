
import type { ChatInputCommandInteraction } from "discord.js";
import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as config from "../../config";
import type { Database } from "../../database";

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
        await interaction.reply({ content: `${config.emojis.error} **Only the Server Owner, Extra Owners, or Bot Owner can manage the Antinuke system.**`, ephemeral: true });
        return;
    }

    const sub = interaction.options.getSubcommand();

    const embedStyle = (title: string, description: string) => {
        return new EmbedBuilder()
            .setColor(config.colors.primary)
            .setDescription(`**${config.emojis.antinuke} ${title}**\n\n${description}`)
            .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
    };

    if (sub === 'enable') {
        if (guildData.antinuke.enabled) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setDescription(`${config.emojis.error} **Antinuke is already enabled!**`)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            await interaction.reply({ embeds: [embed] });
            return;
        }

        guildData.antinuke.enabled = true;

        let logChannel = interaction.guild.channels.cache.find(c => c.name === 'xeon-log' && c.type === ChannelType.GuildText);
        if (!logChannel) {
            try {
                logChannel = await interaction.guild.channels.create({
                    name: 'xeon-log',
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

        const channelMsg = logChannel ? `\n<:1709locked:1461066037008269434> Log channel set to <#${logChannel.id}>.` : `\n⚠️ Could not create 'xeon-log'. Please set logs manually.`;

        const protections = [
            'Anti Ban', 'Anti Kick', 'Anti Prune', 'Anti Unban', 'Anti Bot Add',
            'Anti Role Create', 'Anti Role Delete', 'Anti Role Update',
            'Anti Channel Create', 'Anti Channel Delete',
            'Anti Server Update', 'Anti Vanity URL', 'Anti Webhook Update',
            'Anti Emoji Update', 'Anti Sticker Update', 'Anti Integration',
            'Anti AutoMod Rule', 'Anti Thread Create', 'Anti Thread Delete'
        ].map(p => `> ${config.emojis.success} ${p}`).join('\n');

        const embed = embedStyle('Antinuke Panel', `**Antinuke System Enabled.**\n\n**Active Protections:**\n${protections}\n${channelMsg}\n<:527192nikkiworking:1461069361115824168> **Note:** Keep my role on top with Admin perms.`);
        await interaction.reply({ embeds: [embed] });

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
        ].map(p => `> ${config.emojis.error} ${p}`).join('\n');

        const embed = embedStyle('Antinuke Panel', `**Antinuke System Disabled.**\n\n**Inactive Protections:**\n${protections}\n\n⚠️ **Your server is now vulnerable.**\nUse \`/antinuke enable\` to restore security.`);
        await interaction.reply({ embeds: [embed] });

    } else if (sub === 'show') {
        const logChannelId = guildData.antinuke.logChannelId;
        const channelMsg = logChannelId ? `\n<:1709locked:1461066037008269434> **Log Channel:** <#${logChannelId}>` : `\n${config.emojis.warning} Could not find 'xeon-log'. Please set logs manually.`;

        const statusEmoji = guildData.antinuke.enabled ? config.emojis.success : config.emojis.error;
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
            description += `\n${channelMsg}\n<:527192nikkiworking:1461069361115824168> **Note:** Keep my role on top with Admin perms.`;
        } else {
            description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antinuke enable\` to activate security and protect your server! <:6581lockkey:1461100873479487559>`;
        }

        const embed = embedStyle('Antinuke Panel', description);
        await interaction.reply({ embeds: [embed] });

    } else {
        // Help Menu
        const embed = embedStyle('Antinuke Commands',
            `\`${config.prefix}antinuke enable\`\n` +
            `\`${config.prefix}antinuke disable\`\n` +
            `\`${config.prefix}antinuke show\``
        );
        // embed.setFooter({ text: 'Xeon • Automated Security', iconURL: interaction.client.user?.displayAvatarURL() || undefined }); // Removed to use default user footer

        await interaction.reply({ embeds: [embed] });
    }
}
