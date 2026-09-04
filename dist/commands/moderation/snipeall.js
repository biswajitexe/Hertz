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
exports.command = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
const SnipeManager_1 = require("../../structures/SnipeManager");
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('snipeall')
    .setDescription('Show a list of recently deleted messages in this channel.')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages);
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const snipes = SnipeManager_1.snipeCache.get(interaction.channelId);
        if (!snipes || snipes.length === 0) {
            return interaction.reply((0, componentV2_1.createErrorV2)("There is nothing to snipe here!").toPayload({ ephemeral: true }));
        }
        const embed = new componentV2_1.V2Embed()
            .setColor(config.colors.default)
            .setTitle(`Recently Deleted Messages`)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        let description = `> Deleted message history in <#${interaction.channelId}>.\n\n`;
        const displaySnipes = snipes.slice(0, 10);
        displaySnipes.forEach((data, index) => {
            const time = Math.floor(data.timestamp / 1000);
            const content = data.content ? (data.content.length > 50 ? data.content.substring(0, 50) + "..." : data.content) : "[Image/Attachment]";
            description += `• **${index + 1}.** <t:${time}:R> **${data.authorTag}**: ${content}\n`;
        });
        embed.setDescription(description);
        yield interaction.reply(embed.toPayload());
    });
}
