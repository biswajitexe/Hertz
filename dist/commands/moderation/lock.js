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
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the current or specified channel')
    .addChannelOption(option => option.setName('channel').setDescription('The channel to lock (optional)').setRequired(false));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild || !interaction.channel)
            return;
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        if (!channel)
            return interaction.reply((0, componentV2_1.createErrorV2)("Could not resolve channel.").toPayload({ ephemeral: true }));
        if (channel.isThread()) {
            return interaction.reply((0, componentV2_1.createErrorV2)("Threads cannot be locked individually via this command.").toPayload({ ephemeral: true }));
        }
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageChannels)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply((0, componentV2_1.createErrorV2)("You do not have permission to manage channels.").toPayload({ ephemeral: true }));
        }
        const currentOverwrites = channel.permissionOverwrites.cache.get(interaction.guild.id);
        if (currentOverwrites && currentOverwrites.deny.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
            return interaction.reply((0, componentV2_1.createErrorV2)("**This channel is already locked.**").toPayload({ ephemeral: true }));
        }
        try {
            yield channel.permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: false
            });
            const embed = new componentV2_1.V2Embed()
                .setColor(0xED4245)
                .setTitle(`${config.emojis.success || "🔒"} Channel Locked`)
                .setDescription(`Successfully locked **<#${channel.id}>** from regular messages.`);
            return interaction.reply(embed.toPayload());
        }
        catch (err) {
            console.error(err);
            return interaction.reply((0, componentV2_1.createErrorV2)("Failed to manage channel permissions. Check my role permissions.").toPayload({ ephemeral: true }));
        }
    });
}
