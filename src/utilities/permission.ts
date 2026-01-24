import { GuildMember } from 'discord.js';

/* Returns true if a can moderate b. */
export function canModerate(a: GuildMember, b: GuildMember, permission: bigint): boolean {
    const ownerIds = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (ownerIds.includes(a.id)) return true; // Bot Owner Bypass
    return (a.permissions.has(permission) && a.roles.highest.rawPosition > b.roles.highest.rawPosition) || a.guild.ownerId == a.id;
}