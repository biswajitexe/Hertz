import {
    EmbedBuilder,
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

export function stripEmojis(str: string): string {
    return str || '';
}

/**
 * Modern Discord Embed and Container Builder
 * Defaults to sleek dark 0x2B2D31 styling with Hertz footer and custom asset emojis.
 */
export class V2Embed {
    private accentColor: number = config.colors.default;
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
        this.accentColor = config.colors.default;
    }

    public setColor(color: ColorResolvable): this {
        try {
            this.accentColor = resolveColor(color);
        } catch {
            this.accentColor = config.colors.default;
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
        for (const f of fields) {
            this.fields.push({
                name: f.name,
                value: f.value || '',
                inline: f.inline
            });
        }
        return this;
    }

    public setFields(...fields: V2FieldOptions[]): this {
        this.fields = [];
        return this.addFields(...fields);
    }

    public setFooter(footer: V2FooterOptions | string, iconURL?: string): this {
        if (typeof footer === 'string') {
            this.footerData = { text: footer, iconURL };
        } else {
            this.footerData = footer;
        }
        return this;
    }

    public setTimestamp(timestamp?: Date | number): this {
        this.timestampDate = timestamp || new Date();
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
     * Builds a native Discord EmbedBuilder
     */
    public buildEmbed(): EmbedBuilder {
        const embed = new EmbedBuilder();
        embed.setColor(this.accentColor || config.colors.default);

        if (this.authorData) {
            embed.setAuthor({
                name: this.authorData.name,
                iconURL: this.authorData.iconURL,
                url: this.authorData.url
            });
        }

        if (this.titleText) {
            embed.setTitle(this.titleText);
        }

        if (this.titleURL) {
            embed.setURL(this.titleURL);
        }

        if (this.descriptionText) {
            embed.setDescription(this.descriptionText);
        }

        if (this.thumbnailURL) {
            embed.setThumbnail(this.thumbnailURL);
        }

        if (this.imageURL) {
            embed.setImage(this.imageURL);
        }

        if (this.fields.length > 0) {
            embed.addFields(this.fields);
        }

        let footerText = this.footerData?.text;
        if (!footerText || footerText.trim() === '') {
            footerText = "Powered by Hertz";
        } else if (!footerText.toLowerCase().includes("powered by hertz")) {
            footerText = `${footerText} | Powered by Hertz`;
        }

        embed.setFooter({
            text: footerText,
            iconURL: this.footerData?.iconURL
        });

        if (this.timestampDate) {
            embed.setTimestamp(this.timestampDate);
        }

        return embed;
    }

    /**
     * Compiles properties into ContainerBuilder for v2 compatibility
     */
    public build(): ContainerBuilder {
        const container = new ContainerBuilder();
        container.setAccentColor(this.accentColor || config.colors.default);

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

        let footerText = this.footerData?.text;
        if (!footerText || footerText.trim() === '') {
            footerText = "Powered by Hertz";
        } else if (!footerText.toLowerCase().includes("powered by hertz")) {
            footerText = `${footerText} | Powered by Hertz`;
        }

        if (this.useDividers) {
            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small)
            );
        }
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ${footerText}`)
        );

        for (const row of this.actionRows) {
            container.addActionRowComponents(row);
        }

        return container;
    }

    /**
     * Converts embed into a Discord API response payload
     */
    public toPayload(options?: V2PayloadOptions): {
        embeds: EmbedBuilder[];
        components: any[];
        flags?: number;
        allowedMentions: { repliedUser: boolean };
    } {
        const embed = this.buildEmbed();
        const rows = [...this.actionRows];

        if (options?.extraComponents && options.extraComponents.length > 0) {
            for (const item of options.extraComponents) {
                if (item instanceof ActionRowBuilder || (item && (item.data?.type === 1 || item.type === 1))) {
                    rows.push(item);
                }
            }
        }

        return {
            embeds: [embed],
            components: rows,
            flags: options?.ephemeral ? MessageFlags.Ephemeral : undefined,
            allowedMentions: options?.allowedMentions || { repliedUser: false }
        };
    }
}

// -------------------------------------------------------------
// Pre-styled Factory Helpers
// -------------------------------------------------------------

export function createSuccessV2(description: string, title?: string, user?: User | GuildMember): V2Embed {
    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setDescription(`${config.emojis.correct} ${description}`);
    if (title) embed.setTitle(title);
    if (user) {
        const name = 'user' in user ? user.user.username : user.username;
        embed.setFooter(`Requested by ${name}! | Powered by Hertz`);
    } else {
        embed.setFooter(`Powered by Hertz`);
    }
    return embed;
}

export function createErrorV2(description: string, title?: string, user?: User | GuildMember): V2Embed {
    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setDescription(`${config.emojis.wrong} ${description}`);
    if (title) embed.setTitle(title);
    if (user) {
        const name = 'user' in user ? user.user.username : user.username;
        embed.setFooter(`Requested by ${name}! | Powered by Hertz`);
    } else {
        embed.setFooter(`Powered by Hertz`);
    }
    return embed;
}

export function createWarningV2(description: string, title?: string, user?: User | GuildMember): V2Embed {
    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setDescription(`${config.emojis.warning} ${description}`);
    if (title) embed.setTitle(title);
    if (user) {
        const name = 'user' in user ? user.user.username : user.username;
        embed.setFooter(`Requested by ${name}! | Powered by Hertz`);
    } else {
        embed.setFooter(`Powered by Hertz`);
    }
    return embed;
}

export function createInfoV2(description: string, title?: string, user?: User | GuildMember): V2Embed {
    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setDescription(description);
    if (title) embed.setTitle(title);
    if (user) {
        const name = 'user' in user ? user.user.username : user.username;
        embed.setFooter(`Requested by ${name}! | Powered by Hertz`);
    } else {
        embed.setFooter(`Powered by Hertz`);
    }
    return embed;
}

// -------------------------------------------------------------
// Dispatch Helpers for Interactions and Channels
// -------------------------------------------------------------

function preparePayload(v2: V2Embed | ContainerBuilder | any, options?: V2PayloadOptions): any {
    if (v2 instanceof V2Embed) {
        return v2.toPayload(options);
    } else if (v2 instanceof EmbedBuilder) {
        const rows = options?.extraComponents || [];
        return {
            embeds: [v2],
            components: rows,
            flags: options?.ephemeral ? MessageFlags.Ephemeral : undefined,
            allowedMentions: options?.allowedMentions || { repliedUser: false }
        };
    } else if (v2 instanceof ContainerBuilder) {
        return {
            components: [v2],
            flags: options?.ephemeral ? (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) : MessageFlags.IsComponentsV2,
            allowedMentions: options?.allowedMentions || { repliedUser: false }
        };
    }
    return v2;
}

export async function replyV2(
    target: any,
    v2: V2Embed | ContainerBuilder | any,
    options?: V2PayloadOptions
): Promise<any> {
    const payload = preparePayload(v2, options);

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
    const payload = preparePayload(v2, options);
    return await target.editReply(payload);
}

export async function updateV2(
    target: any,
    v2: V2Embed | ContainerBuilder | any,
    options?: V2PayloadOptions
): Promise<any> {
    const payload = preparePayload(v2, options);
    return await target.update(payload);
}

export async function sendV2(
    target: any,
    v2: V2Embed | ContainerBuilder | any,
    options?: V2PayloadOptions
): Promise<any> {
    const payload = preparePayload(v2, options);
    return await target.send(payload);
}
