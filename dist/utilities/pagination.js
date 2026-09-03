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
exports.pagination = pagination;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../config"));
const componentV2_1 = require("./componentV2");
function pagination(interaction_1, title_1, items_1) {
    return __awaiter(this, arguments, void 0, function* (interaction, title, items, itemsPerPage = 10, iconURL = null) {
        if (items.length === 0) {
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.primary)
                .setTitle(title)
                .setDescription(`**No items found.**`)
                .setFooter(`Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());
            if (iconURL)
                embed.setAuthor(title, iconURL);
            return interaction.editReply(embed.toPayload());
        }
        const totalPages = Math.ceil(items.length / itemsPerPage);
        let currentPage = 0;
        const generateButtons = (page) => {
            const row = new discord_js_1.ActionRowBuilder();
            const prev = new discord_js_1.ButtonBuilder()
                .setCustomId('prev')
                .setEmoji('1465399219623039038')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(page === 0);
            const stop = new discord_js_1.ButtonBuilder()
                .setCustomId('stop')
                .setEmoji('1465399171799453706')
                .setStyle(discord_js_1.ButtonStyle.Danger);
            const next = new discord_js_1.ButtonBuilder()
                .setCustomId('next')
                .setEmoji('1465399275805741292')
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setDisabled(page === totalPages - 1);
            row.addComponents(prev, stop, next);
            return row;
        };
        const generatePage = (page, withButtons = true) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const currentItems = items.slice(start, end);
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.primary)
                .setTitle(title)
                .setDescription(currentItems.join('\n'))
                .setFooter(`Page ${page + 1} / ${totalPages} • Requested by ${interaction.user.tag}`, interaction.user.displayAvatarURL());
            if (iconURL)
                embed.setAuthor(title, iconURL);
            if (withButtons && totalPages > 1) {
                embed.addActionRow(generateButtons(page));
            }
            return embed;
        };
        const initialPage = generatePage(currentPage);
        const msg = yield interaction.editReply(initialPage.toPayload());
        if (totalPages <= 1)
            return;
        const collector = msg.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            time: 60000
        });
        collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
            if (i.user.id !== interaction.user.id) {
                yield i.reply({ content: 'This menu is not for you.', ephemeral: true });
                return;
            }
            if (i.customId === 'prev') {
                currentPage--;
            }
            else if (i.customId === 'next') {
                currentPage++;
            }
            else if (i.customId === 'stop') {
                collector.stop();
                return;
            }
            if (currentPage < 0)
                currentPage = 0;
            if (currentPage >= totalPages)
                currentPage = totalPages - 1;
            yield i.update(generatePage(currentPage).toPayload());
        }));
        collector.on('end', () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield interaction.editReply(generatePage(currentPage, false).toPayload());
            }
            catch (e) { }
        }));
    });
}
