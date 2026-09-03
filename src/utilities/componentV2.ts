import {
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ActionRowBuilder,
    MessageFlags,
    ColorResolvable,
    resolveColor,
    User,
    GuildMember
} from "discord.js";
import * as config from "../config";

export interface V2AuthorOptions {
    name: string;
    iconURL?: string;
    url?: string;
}

export interface V2FooterOptions {
    text: string;
    iconURL?: string;
}

export interface V2FieldOptions {
    name: string;
    value: string;
    inline?: boolean;
}

export interface V2PayloadOptions {
    ephemeral?: boolean;
    allowedMentions?: any;
    extraComponents?: any[];
}

/**
 * Modern Discord Components V2 Container Builder
 * Fully supersedes legacy EmbedBuilder with rich structured cards.
 */
export class V2Embed {
    private accentColor: number = config.colors.primary;
    private authorData?: V2AuthorOptions;
    private titleText?: string;
    private titleURL?: string;
    private descriptionText?: string;
    private thumbnailURL?: string;
    private imageURL?: string;
    private fields: V2FieldOptions[] = [];
    private footerData?: V2FooterOptions;
    private timestampDate?: Date | number;
    private actionRows: ActionRowBuilder<any>[] = [];
    private useDividers: boolean = true;

    constructor() {
        this.accentColor = config.colors.primary;
    }

    public setColor(color: ColorResolvable): this {
        try {
            this.accentColor = resolveColor(color);
        } catch {
            this.accentColor = config.colors.primary;
        }
        return this;
    }

    public setAccentColor(color: ColorResolvable): this {
        return this.setColor(color);
    }

    public setTitle(title: string): this {
        this.titleText = title;
        return this;
    }

    public setURL(url: string): this {
        this.titleURL = url;
        return this;
    }

    public setDescription(description: string): this {
        this.descriptionText = description;
        return this;
    }

    public setAuthor(author: V2AuthorOptions | string, iconURL?: string, url?: string): this {
        if (typeof author === 'string') {
            this.authorData = { name: author, iconURL, url };
        } else {
            this.authorData = author;
        }
        return this;
    }

    public setThumbnail(url: string | null | undefined): this {
        this.thumbnailURL = url || undefined;
        return this;
    }

    public setImage(url: string | null | undefined): this {
        this.imageURL = url || undefined;
        return this;
    }

    public addFields(...fields: V2FieldOptions[]): this {
        this.fields.push(...fields);
        return this;
    }

    public setFields(...fields: V2FieldOptions[]): this {
        this.fields = [...fields];
        return this;
    }

    public setFooter(footer: V2FooterOptions | string, iconURL?: string): this {
        if (typeof footer === 'string') {
            this.footerData = { text: footer, iconURL };
        } else {
            this.footerData = footer;
        }
        return this;
    }

    public setTimestamp(timestamp: Date | number = Date.now()): this {
        this.timestampDate = timestamp;
        return this;
    }

    public addActionRow(row: ActionRowBuilder<any>): this {
        this.actionRows.push(row);
        return this;
    }

    public addActionRows(...rows: ActionRowBuilder<any>[]): this {
        this.actionRows.push(...rows);
        return this;
    }

    public setDivider(enabled: boolean): this {
        this.useDividers = enabled;
        return this;
    }

    /**
     * Compiles all properties into a native Discord.js ContainerBuilder
     */
    public build(): ContainerBuilder {
        const container = new ContainerBuilder();
        container.setAccentColor(this.accentColor);

        // Header construction (Author + Title + Description)
        const headerParts: string[] = [];

        if (this.authorData?.name) {
            headerParts.push(`-# **${this.authorData.name}**`);
        }

        if (this.titleText) {
            if (this.titleURL) {
                headerParts.push(`### [${this.titleText}](${this.titleURL})`);
            } else {
                headerParts.push(`### ${this.titleText}`);
            }
        }

        if (this.descriptionText) {
            headerParts.push(this.descriptionText);
        }

        const headerContent = headerParts.join("\n");

        if (this.thumbnailURL && headerContent.trim().length > 0) {
            // Place inside a SectionBuilder with Thumbnail accessory
            const section = new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(headerContent)
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(this.thumbnailURL)
                );
            container.addSectionComponents(section);
        } else if (headerContent.trim().length > 0) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(headerContent)
            );
        }

        // Fields construction
        if (this.fields.length > 0) {
            if (this.useDividers && headerContent.trim().length > 0) {
                container.addSeparatorComponents(
                    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
                );
            }

            const fieldTexts: string[] = [];
            for (const field of this.fields) {
                fieldTexts.push(`**${field.name}**\n${field.value}`);
            }

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(fieldTexts.join("\n\n"))
            );
        }

        // Media Gallery / Large Image
        if (this.imageURL) {
            if (this.useDividers) {
                container.addSeparatorComponents(
                    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
                );
            }

            const gallery = new MediaGalleryBuilder().addItems(
                new MediaGalleryItemBuilder().setURL(this.imageURL)
            );
            container.addMediaGalleryComponents(gallery);
        }

        // Footer / Timestamp
        const footerParts: string[] = [];
        if (this.footerData?.text) {
            footerParts.push(this.footerData.text);
        }
        if (this.timestampDate) {
            const unix = Math.floor((this.timestampDate instanceof Date ? this.timestampDate.getTime() : this.timestampDate) / 1000);
            footerParts.push(`<t:${unix}:R>`);
        }

        if (footerParts.length > 0) {
            if (this.useDividers) {
                container.addSeparatorComponents(
                    new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
                );
            }

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# ${footerParts.join(" • ")}`)
            );
        }

        // Embedded Action Rows
        for (const row of this.actionRows) {
            container.addActionRowComponents(row);
        }

        return container;
    }

    /**
     * Converts container into a Discord API response payload
     */
    public toPayload(options?: V2PayloadOptions): {
        components: any[];
        flags: number;
        allowedMentions: { repliedUser: boolean };
    } {
        let flagBitfield: number = MessageFlags.IsComponentsV2;
        if (options?.ephemeral) {
            flagBitfield |= MessageFlags.Ephemeral;
        }

        const components: any[] = [this.build()];
        if (options?.extraComponents && options.extraComponents.length > 0) {
            components.push(...options.extraComponents);
        }

        return {
            components,
            flags: flagBitfield,
            allowedMentions: options?.allowedMentions || { repliedUser: false }
        };
    }
}

// -------------------------------------------------------------
// Pre-styled Factory Helpers
// -------------------------------------------------------------

export function createSuccessV2(description: string, title?: string): V2Embed {
    const embed = new V2Embed()
        .setColor(config.colors.success)
        .setDescription(`${config.emojis.success} ${description}`);
    if (title) embed.setTitle(title);
    return embed;
}

export function createErrorV2(description: string, title?: string): V2Embed {
    const embed = new V2Embed()
        .setColor(config.colors.error)
        .setDescription(`${config.emojis.error} ${description}`);
    if (title) embed.setTitle(title);
    return embed;
}

export function createWarningV2(description: string, title?: string): V2Embed {
    const embed = new V2Embed()
        .setColor(config.colors.warning)
        .setDescription(`${config.emojis.warning} ${description}`);
    if (title) embed.setTitle(title);
    return embed;
}

export function createInfoV2(description: string, title?: string): V2Embed {
    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setDescription(description);
    if (title) embed.setTitle(title);
    return embed;
}

// -------------------------------------------------------------
// Dispatch Helpers for Interactions and Channels
// -------------------------------------------------------------

export async function replyV2(
    target: any,
    v2: V2Embed | ContainerBuilder | any,
    options?: V2PayloadOptions
): Promise<any> {
    const payload = v2 instanceof V2Embed ? v2.toPayload(options) : (v2 instanceof ContainerBuilder ? {
        components: [v2, ...(options?.extraComponents || [])],
        flags: options?.ephemeral ? (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) : MessageFlags.IsComponentsV2,
        allowedMentions: options?.allowedMentions || { repliedUser: false }
    } : v2);

    if (target.replied || target.deferred) {
        return await target.editReply(payload);
    } else if (typeof target.reply === 'function') {
        return await target.reply(payload);
    } else if (typeof target.send === 'function') {
        return await target.send(payload);
    }
}

export async function editReplyV2(
    target: any,
    v2: V2Embed | ContainerBuilder | any,
    options?: V2PayloadOptions
): Promise<any> {
    const payload = v2 instanceof V2Embed ? v2.toPayload(options) : (v2 instanceof ContainerBuilder ? {
        components: [v2, ...(options?.extraComponents || [])],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: options?.allowedMentions || { repliedUser: false }
    } : v2);

    return await target.editReply(payload);
}

export async function updateV2(
    target: any,
    v2: V2Embed | ContainerBuilder | any,
    options?: V2PayloadOptions
): Promise<any> {
    const payload = v2 instanceof V2Embed ? v2.toPayload(options) : (v2 instanceof ContainerBuilder ? {
        components: [v2, ...(options?.extraComponents || [])],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: options?.allowedMentions || { repliedUser: false }
    } : v2);

    return await target.update(payload);
}

export async function sendV2(
    target: any,
    v2: V2Embed | ContainerBuilder | any,
    options?: V2PayloadOptions
): Promise<any> {
    const payload = v2 instanceof V2Embed ? v2.toPayload(options) : (v2 instanceof ContainerBuilder ? {
        components: [v2, ...(options?.extraComponents || [])],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: options?.allowedMentions || { repliedUser: false }
    } : v2);

    return await target.send(payload);
}
