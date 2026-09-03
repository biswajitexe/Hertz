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
        this.fields.push(...fields);
        return this;
    }
    setFields(...fields) {
        this.fields = [...fields];
        return this;
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
        let flagBitfield = discord_js_1.MessageFlags.IsComponentsV2;
        if (options === null || options === void 0 ? void 0 : options.ephemeral) {
            flagBitfield |= discord_js_1.MessageFlags.Ephemeral;
        }
        const components = [this.build()];
        if ((options === null || options === void 0 ? void 0 : options.extraComponents) && options.extraComponents.length > 0) {
            components.push(...options.extraComponents);
        }
        return {
            components,
            flags: flagBitfield,
            allowedMentions: (options === null || options === void 0 ? void 0 : options.allowedMentions) || { repliedUser: false }
        };
    }
}
exports.V2Embed = V2Embed;
function createSuccessV2(description, title) {
    const embed = new V2Embed()
        .setColor(config.colors.success)
        .setDescription(`${config.emojis.success} ${description}`);
    if (title)
        embed.setTitle(title);
    return embed;
}
function createErrorV2(description, title) {
    const embed = new V2Embed()
        .setColor(config.colors.error)
        .setDescription(`${config.emojis.error} ${description}`);
    if (title)
        embed.setTitle(title);
    return embed;
}
function createWarningV2(description, title) {
    const embed = new V2Embed()
        .setColor(config.colors.warning)
        .setDescription(`${config.emojis.warning} ${description}`);
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
function replyV2(target, v2, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = v2 instanceof V2Embed ? v2.toPayload(options) : (v2 instanceof discord_js_1.ContainerBuilder ? {
            components: [v2, ...((options === null || options === void 0 ? void 0 : options.extraComponents) || [])],
            flags: (options === null || options === void 0 ? void 0 : options.ephemeral) ? (discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral) : discord_js_1.MessageFlags.IsComponentsV2,
            allowedMentions: (options === null || options === void 0 ? void 0 : options.allowedMentions) || { repliedUser: false }
        } : v2);
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
        const payload = v2 instanceof V2Embed ? v2.toPayload(options) : (v2 instanceof discord_js_1.ContainerBuilder ? {
            components: [v2, ...((options === null || options === void 0 ? void 0 : options.extraComponents) || [])],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            allowedMentions: (options === null || options === void 0 ? void 0 : options.allowedMentions) || { repliedUser: false }
        } : v2);
        return yield target.editReply(payload);
    });
}
function updateV2(target, v2, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = v2 instanceof V2Embed ? v2.toPayload(options) : (v2 instanceof discord_js_1.ContainerBuilder ? {
            components: [v2, ...((options === null || options === void 0 ? void 0 : options.extraComponents) || [])],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            allowedMentions: (options === null || options === void 0 ? void 0 : options.allowedMentions) || { repliedUser: false }
        } : v2);
        return yield target.update(payload);
    });
}
function sendV2(target, v2, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = v2 instanceof V2Embed ? v2.toPayload(options) : (v2 instanceof discord_js_1.ContainerBuilder ? {
            components: [v2, ...((options === null || options === void 0 ? void 0 : options.extraComponents) || [])],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            allowedMentions: (options === null || options === void 0 ? void 0 : options.allowedMentions) || { repliedUser: false }
        } : v2);
        return yield target.send(payload);
    });
}
