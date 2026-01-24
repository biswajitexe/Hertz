
import { EmbedBuilder, User, CommandInteraction } from "discord.js";
import * as config from "../config";

export function createSuccessEmbed(user: User, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(`${config.emojis.success} ${description}`);
}

export function createErrorEmbed(user: User, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(config.colors.error)
        .setDescription(`${config.emojis.error} ${description}`);
}

export function createWarningEmbed(user: User, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(config.colors.warning)
        .setDescription(`${config.emojis.warning} ${description}`);
}
