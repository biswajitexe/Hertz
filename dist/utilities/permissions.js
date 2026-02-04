"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canModerate = canModerate;
function canModerate(a, b, permission) {
    return (a.permissions.has(permission) && a.roles.highest.rawPosition > b.roles.highest.rawPosition) || a.guild.ownerId == a.id;
}
