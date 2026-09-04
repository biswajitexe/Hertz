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

export function stripEmojis(str: string): string {
    return str || '';
}

/**
 * Modern Discord Components V2 Container Builder
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
     * Compiles properties into ContainerBuilder for Discord Components V2
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
            let currentInlineGroup: string[] = [];

            for (const field of this.fields) {
                if (field.inline) {
                    currentInlineGroup.push(`**${field.name}:** ${field.value}`);
                } else {
                    if (currentInlineGroup.length > 0) {
                        fieldTexts.push(currentInlineGroup.join(" • "));
                        currentInlineGroup = [];
                    }
                    fieldTexts.push(`**${field.name}**\n${field.value}`);
                }
            }
            if (currentInlineGroup.length > 0) {
                fieldTexts.push(currentInlineGroup.join(" • "));
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

        if (this.timestampDate) {
            const unix = Math.floor((this.timestampDate instanceof Date ? this.timestampDate.getTime() : this.timestampDate) / 1000);
            footerText = `${footerText} • <t:${unix}:R>`;
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
     * Converts container into a Discord API response payload using Discord Components V2
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

        const container = this.build();
        const components: any[] = [container];

        if (options?.extraComponents && options.extraComponents.length > 0) {
            for (const item of options.extraComponents) {
                if (item) {
                    components.push(item);
                }
            }
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
    } else if (v2 instanceof ContainerBuilder) {
        const components: any[] = [v2];
        if (options?.extraComponents && options.extraComponents.length > 0) {
            for (const item of options.extraComponents) {
                if (item) components.push(item);
            }
        }
        return {
            components,
            flags: options?.ephemeral ? (MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral) : MessageFlags.IsComponentsV2,
            allowedMentions: options?.allowedMentions || { repliedUser: false }
        };
    } else if (v2 && typeof v2.toPayload === 'function') {
        return v2.toPayload(options);
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
