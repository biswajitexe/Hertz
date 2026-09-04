"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.V2Embed = void 0;
exports.stripEmojis = stripEmojis;
exports.createSuccessV2 = createSuccessV2;
exports.createErrorV2 = createErrorV2;
exports.createWarningV2 = createWarningV2;
exports.createInfoV2 = createInfoV2;
exports.replyV2 = replyV2;
exports.editReplyV2 = editReplyV2;
exports.updateV2 = updateV2;
exports.sendV2 = sendV2;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../config"));
function stripEmojis(str) {
    return str || '';
}
class V2Embed {
    constructor() {
        this.accentColor = config.colors.default;
        this.fields = [];
        this.actionRows = [];
        this.useDividers = true;
        this.accentColor = config.colors.default;
    }
    setColor(color) {
        try {
            this.accentColor = (0, discord_js_1.resolveColor)(color);
        }
        catch (_a) {
            this.accentColor = config.colors.default;
        }
        return this;
    }
    setAccentColor(color) {
        return this.setColor(color);
    }
    setTitle(title) {
        this.titleText = title;
        return this;
    }
    setURL(url) {
        this.titleURL = url;
        return this;
    }
    setDescription(description) {
        this.descriptionText = description;
        return this;
    }
    setAuthor(author, iconURL, url) {
        if (typeof author === 'string') {
            this.authorData = { name: author, iconURL, url };
        }
        else {
            this.authorData = author;
        }
        return this;
    }
    setThumbnail(url) {
        this.thumbnailURL = url || undefined;
        return this;
    }
    setImage(url) {
        this.imageURL = url || undefined;
        return this;
    }
    addFields(...fields) {
        for (const f of fields) {
            this.fields.push({
                name: f.name,
                value: f.value || '',
                inline: f.inline
            });
        }
        return this;
    }
    setFields(...fields) {
        this.fields = [];
        return this.addFields(...fields);
    }
    setFooter(footer, iconURL) {
        if (typeof footer === 'string') {
            this.footerData = { text: footer, iconURL };
        }
        else {
            this.footerData = footer;
        }
        return this;
    }
    setTimestamp(timestamp) {
        this.timestampDate = timestamp || new Date();
        return this;
    }
    addActionRow(row) {
        this.actionRows.push(row);
        return this;
    }
    addActionRows(...rows) {
        this.actionRows.push(...rows);
        return this;
    }
    setDivider(enabled) {
        this.useDividers = enabled;
        return this;
    }
    build() {
        var _a, _b;
        const container = new discord_js_1.ContainerBuilder();
        container.setAccentColor(this.accentColor || config.colors.default);
        const headerParts = [];
        if ((_a = this.authorData) === null || _a === void 0 ? void 0 : _a.name) {
            headerParts.push(`-# **${this.authorData.name}**`);
        }
        if (this.titleText) {
            if (this.titleURL) {
                headerParts.push(`### [${this.titleText}](${this.titleURL})`);
            }
            else {
                headerParts.push(`### ${this.titleText}`);
            }
        }
        if (this.descriptionText) {
            headerParts.push(this.descriptionText);
        }
        const headerContent = headerParts.join("\n");
        if (this.thumbnailURL && headerContent.trim().length > 0) {
            const section = new discord_js_1.SectionBuilder()
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(headerContent))
                .setThumbnailAccessory(new discord_js_1.ThumbnailBuilder().setURL(this.thumbnailURL));
            container.addSectionComponents(section);
        }
        else if (headerContent.trim().length > 0) {
            container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(headerContent));
        }
        if (this.fields.length > 0) {
            if (this.useDividers && headerContent.trim().length > 0) {
                container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true).setSpacing(discord_js_1.SeparatorSpacingSize.Small));
            }
            const fieldTexts = [];
            let currentInlineGroup = [];
            for (const field of this.fields) {
                if (field.inline) {
                    currentInlineGroup.push(`**${field.name}:** ${field.value}`);
                }
                else {
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
            container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(fieldTexts.join("\n\n")));
        }
        if (this.imageURL) {
            if (this.useDividers) {
                container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true).setSpacing(discord_js_1.SeparatorSpacingSize.Small));
            }
            const gallery = new discord_js_1.MediaGalleryBuilder().addItems(new discord_js_1.MediaGalleryItemBuilder().setURL(this.imageURL));
            container.addMediaGalleryComponents(gallery);
        }
        let footerText = (_b = this.footerData) === null || _b === void 0 ? void 0 : _b.text;
        if (!footerText || footerText.trim() === '') {
            footerText = "Powered by Hertz";
        }
        else if (!footerText.toLowerCase().includes("powered by hertz")) {
            footerText = `${footerText} | Powered by Hertz`;
        }
        if (this.timestampDate) {
            const unix = Math.floor((this.timestampDate instanceof Date ? this.timestampDate.getTime() : this.timestampDate) / 1000);
            footerText = `${footerText} • <t:${unix}:R>`;
        }
        if (this.useDividers) {
            container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true).setSpacing(discord_js_1.SeparatorSpacingSize.Small));
        }
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${footerText}`));
        for (const row of this.actionRows) {
            container.addActionRowComponents(row);
        }
        return container;
    }
    toPayload(options) {
        let flagBitfield = discord_js_1.MessageFlags.IsComponentsV2;
        if (options === null || options === void 0 ? void 0 : options.ephemeral) {
            flagBitfield |= discord_js_1.MessageFlags.Ephemeral;
        }
        const container = this.build();
        const components = [container];
        if ((options === null || options === void 0 ? void 0 : options.extraComponents) && options.extraComponents.length > 0) {
            for (const item of options.extraComponents) {
                if (item) {
                    components.push(item);
                }
            }
        }
        return {
            components,
            flags: flagBitfield,
            allowedMentions: (options === null || options === void 0 ? void 0 : options.allowedMentions) || { repliedUser: false }
        };
    }
}
exports.V2Embed = V2Embed;
function createSuccessV2(description, title, user) {
    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setDescription(`${config.emojis.correct} ${description}`);
    if (title)
        embed.setTitle(title);
    if (user) {
        const name = 'user' in user ? user.user.username : user.username;
        embed.setFooter(`Requested by ${name}! | Powered by Hertz`);
    }
    else {
        embed.setFooter(`Powered by Hertz`);
    }
    return embed;
}
function createErrorV2(description, title, user) {
    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setDescription(`${config.emojis.wrong} ${description}`);
    if (title)
        embed.setTitle(title);
    if (user) {
        const name = 'user' in user ? user.user.username : user.username;
        embed.setFooter(`Requested by ${name}! | Powered by Hertz`);
    }
    else {
        embed.setFooter(`Powered by Hertz`);
    }
    return embed;
}
function createWarningV2(description, title, user) {
    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setDescription(`${config.emojis.warning} ${description}`);
    if (title)
        embed.setTitle(title);
    if (user) {
        const name = 'user' in user ? user.user.username : user.username;
        embed.setFooter(`Requested by ${name}! | Powered by Hertz`);
    }
    else {
        embed.setFooter(`Powered by Hertz`);
    }
    return embed;
}
function createInfoV2(description, title, user) {
    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setDescription(description);
    if (title)
        embed.setTitle(title);
    if (user) {
        const name = 'user' in user ? user.user.username : user.username;
        embed.setFooter(`Requested by ${name}! | Powered by Hertz`);
    }
    else {
        embed.setFooter(`Powered by Hertz`);
    }
    return embed;
}
function preparePayload(v2, options) {
    if (v2 instanceof V2Embed) {
        return v2.toPayload(options);
    }
    else if (v2 instanceof discord_js_1.ContainerBuilder) {
        const components = [v2];
        if ((options === null || options === void 0 ? void 0 : options.extraComponents) && options.extraComponents.length > 0) {
            for (const item of options.extraComponents) {
                if (item)
                    components.push(item);
            }
        }
        return {
            components,
            flags: (options === null || options === void 0 ? void 0 : options.ephemeral) ? (discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral) : discord_js_1.MessageFlags.IsComponentsV2,
            allowedMentions: (options === null || options === void 0 ? void 0 : options.allowedMentions) || { repliedUser: false }
        };
    }
    else if (v2 && typeof v2.toPayload === 'function') {
        return v2.toPayload(options);
    }
    return v2;
}
function replyV2(target, v2, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = preparePayload(v2, options);
        if (target.replied || target.deferred) {
            return yield target.editReply(payload);
        }
        else if (typeof target.reply === 'function') {
            return yield target.reply(payload);
        }
        else if (typeof target.send === 'function') {
            return yield target.send(payload);
        }
    });
}
function editReplyV2(target, v2, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = preparePayload(v2, options);
        return yield target.editReply(payload);
    });
}
function updateV2(target, v2, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = preparePayload(v2, options);
        return yield target.update(payload);
    });
}
function sendV2(target, v2, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = preparePayload(v2, options);
        return yield target.send(payload);
    });
}
