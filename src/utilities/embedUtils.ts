import { User } from "discord.js";
import * as config from "../config";
import { V2Embed, createSuccessV2, createErrorV2, createWarningV2, replyV2, editReplyV2, sendV2 } from "./componentV2";

export * from "./componentV2";

export function createSuccessEmbed(user: User, description: string): V2Embed {
    return createSuccessV2(description);
}

export function createErrorEmbed(user: User, description: string): V2Embed {
    return createErrorV2(description);
}

export function createWarningEmbed(user: User, description: string): V2Embed {
    return createWarningV2(description);
}
