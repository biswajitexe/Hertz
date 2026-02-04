"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canModerate = canModerate;
function canModerate(a, b, permission) {
    const ownerIds = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (ownerIds.includes(a.id))
        return true;
    return (a.permissions.has(permission) && a.roles.highest.rawPosition > b.roles.highest.rawPosition) || a.guild.ownerId == a.id;
}
