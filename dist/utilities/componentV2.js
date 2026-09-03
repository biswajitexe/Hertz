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
    if (!str)
        return str;
    return str
        .replace(/<a?:[a-zA-Z0-9_]+:[0-9]+>\s*/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}
class V2Embed {
    constructor() {
        this.accentColor = config.colors.primary;
        this.fields = [];
        this.actionRows = [];
        this.useDividers = true;
        this.accentColor = config.colors.primary;
    }
    setColor(color) {
        try {
            this.accentColor = (0, discord_js_1.resolveColor)(color);
        }
        catch (_a) {
            this.accentColor = config.colors.primary;
        }
        return this;
    }
    setAccentColor(color) {
        return this.setColor(color);
    }
    setTitle(title) {
        this.titleText = stripEmojis(title);
        return this;
    }
    setURL(url) {
        this.titleURL = url;
        return this;
    }
    setDescription(description) {
        this.descriptionText = description ? description.replace(/<a?:[a-zA-Z0-9_]+:[0-9]+>\s*/g, '') : undefined;
        return this;
    }
    setAuthor(author, iconURL, url) {
        if (typeof author === 'string') {
            this.authorData = { name: stripEmojis(author), iconURL, url };
        }
        else {
            this.authorData = Object.assign(Object.assign({}, author), { name: stripEmojis(author.name) });
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
                name: stripEmojis(f.name),
                value: f.value ? f.value.replace(/<a?:[a-zA-Z0-9_]+:[0-9]+>\s*/g, '') : '',
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
    setTimestamp(timestamp = Date.now()) {
        this.timestampDate = timestamp;
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
        container.setAccentColor(this.accentColor);
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
            for (const field of this.fields) {
                fieldTexts.push(`**${field.name}**\n${field.value}`);
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
        const footerParts = [];
        if ((_b = this.footerData) === null || _b === void 0 ? void 0 : _b.text) {
            footerParts.push(this.footerData.text);
        }
        if (this.timestampDate) {
            const unix = Math.floor((this.timestampDate instanceof Date ? this.timestampDate.getTime() : this.timestampDate) / 1000);
            footerParts.push(`<t:${unix}:R>`);
        }
        if (footerParts.length > 0) {
            if (this.useDividers) {
                container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true).setSpacing(discord_js_1.SeparatorSpacingSize.Small));
            }
            container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# ${footerParts.join(" • ")}`));
        }
        for (const row of this.actionRows) {
            container.addActionRowComponents(row);
        }
        return container;
    }
    toPayload(options) {
        var _a;
        let flagBitfield = discord_js_1.MessageFlags.IsComponentsV2;
        if (options === null || options === void 0 ? void 0 : options.ephemeral) {
            flagBitfield |= discord_js_1.MessageFlags.Ephemeral;
        }
        const container = this.build();
        if ((options === null || options === void 0 ? void 0 : options.extraComponents) && options.extraComponents.length > 0) {
            container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true).setSpacing(discord_js_1.SeparatorSpacingSize.Small));
            for (const item of options.extraComponents) {
                if (item instanceof discord_js_1.ActionRowBuilder || (item && (((_a = item.data) === null || _a === void 0 ? void 0 : _a.type) === 1 || item.type === 1))) {
                    container.addActionRowComponents(item);
                }
            }
        }
        return {
            components: [container],
            flags: flagBitfield,
            allowedMentions: (options === null || options === void 0 ? void 0 : options.allowedMentions) || { repliedUser: false }
        };
    }
}
exports.V2Embed = V2Embed;
function createSuccessV2(description, title) {
    const embed = new V2Embed()
        .setColor(config.colors.success)
        .setDescription(`**Success:** ${description}`);
    if (title)
        embed.setTitle(title);
    return embed;
}
function createErrorV2(description, title) {
    const embed = new V2Embed()
        .setColor(config.colors.error)
        .setDescription(`**Error:** ${description}`);
    if (title)
        embed.setTitle(title);
    return embed;
}
function createWarningV2(description, title) {
    const embed = new V2Embed()
        .setColor(config.colors.warning)
        .setDescription(`**Warning:** ${description}`);
    if (title)
        embed.setTitle(title);
    return embed;
}
function createInfoV2(description, title) {
    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setDescription(description);
    if (title)
        embed.setTitle(title);
    return embed;
}
function preparePayload(v2, options) {
    var _a;
    if (v2 instanceof V2Embed) {
        return v2.toPayload(options);
    }
    else if (v2 instanceof discord_js_1.ContainerBuilder) {
        if ((options === null || options === void 0 ? void 0 : options.extraComponents) && options.extraComponents.length > 0) {
            v2.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true).setSpacing(discord_js_1.SeparatorSpacingSize.Small));
            for (const item of options.extraComponents) {
                if (item instanceof discord_js_1.ActionRowBuilder || (item && (((_a = item.data) === null || _a === void 0 ? void 0 : _a.type) === 1 || item.type === 1))) {
                    v2.addActionRowComponents(item);
                }
            }
        }
        return {
            components: [v2],
            flags: (options === null || options === void 0 ? void 0 : options.ephemeral) ? (discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral) : discord_js_1.MessageFlags.IsComponentsV2,
            allowedMentions: (options === null || options === void 0 ? void 0 : options.allowedMentions) || { repliedUser: false }
        };
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
