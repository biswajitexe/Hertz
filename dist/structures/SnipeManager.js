"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snipeCache = void 0;
exports.handleSnipe = handleSnipe;
exports.snipeCache = new Map();
function handleSnipe(message) {
    var _a;
    if (message.partial)
        return;
    if (message.author.bot)
        return;
    const snipes = exports.snipeCache.get(message.channel.id) || [];
    snipes.unshift({
        content: message.content || null,
        authorId: message.author.id,
        authorTag: message.author.tag,
        authorAvatar: message.author.displayAvatarURL() || null,
        image: ((_a = message.attachments.first()) === null || _a === void 0 ? void 0 : _a.url) || null,
        timestamp: Date.now()
    });
    if (snipes.length > 20)
        snipes.length = 20;
    exports.snipeCache.set(message.channel.id, snipes);
}
