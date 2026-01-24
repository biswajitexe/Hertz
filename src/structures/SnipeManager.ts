
import { Message, PartialMessage } from "discord.js";

export interface SnipeData {
    content: string | null;
    authorId: string;
    authorTag: string;
    authorAvatar: string | null;
    image: string | null;
    timestamp: number;
}

// Channel ID -> Snipe Data Array
export const snipeCache = new Map<string, SnipeData[]>();

export function handleSnipe(message: Message | PartialMessage) {
    if (message.partial) return;
    if (message.author.bot) return;

    const snipes = snipeCache.get(message.channel.id) || [];

    snipes.unshift({
        content: message.content || null,
        authorId: message.author.id,
        authorTag: message.author.tag,
        authorAvatar: message.author.displayAvatarURL() || null,
        image: message.attachments.first()?.url || null,
        timestamp: Date.now()
    });

    // Keep max 20
    if (snipes.length > 20) snipes.length = 20;

    snipeCache.set(message.channel.id, snipes);
}
