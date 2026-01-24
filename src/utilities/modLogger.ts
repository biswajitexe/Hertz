
import { EmbedBuilder, Guild, User, TextChannel, ColorResolvable } from 'discord.js';
import { Database } from '../database';

export type ModAction = 'BAN' | 'KICK' | 'MUTE' | 'WARN' | 'UNBAN' | 'TIMEOUT' | 'UNKNOWN' | 'UNMUTE';

export async function logAction(
    guild: Guild,
    target: User,
    moderator: User,
    action: ModAction,
    reason: string,
    database: Database,
    extraInfo?: string
) {
    const guildData = await database.retrieveGuild(guild.id);
    if (!guildData || !guildData.antinuke.enabled || !guildData.antinuke.logChannelId) return;

    const channel = guild.channels.cache.get(guildData.antinuke.logChannelId) as TextChannel;
    if (!channel || !channel.isTextBased()) return;

    let color: ColorResolvable = '#ff0000';
    switch (action) {
        case 'BAN': color = '#ff0000'; break;
        case 'UNBAN': color = '#00ff00'; break;
        case 'KICK': color = '#ff9900'; break;
        case 'TIMEOUT': color = '#ffff00'; break;
        case 'WARN': color = '#ffff00'; break;
        case 'MUTE': color = '#ffff00'; break;
        case 'UNMUTE': color = '#00ff00'; break;
    }

    const embed = new EmbedBuilder()
        .setAuthor({ name: `${action} | ${target.tag}`, iconURL: target.displayAvatarURL() })
        .setColor(color)
        .addFields(
            { name: 'User', value: `${target} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${moderator} (${moderator.id})`, inline: true },
            { name: 'Reason', value: reason }
        )
        .setTimestamp();

    if (extraInfo) {
        embed.addFields({ name: 'Additional Info', value: extraInfo });
    }

    await channel.send({ embeds: [embed] }).catch(() => { });
}
