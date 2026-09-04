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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aliases = exports.command = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
const os_1 = __importDefault(require("os"));
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Display detailed bot information and statistics');
exports.aliases = ["bi", "stats", "about"];
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = interaction.client;
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os_1.default.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const platform = os_1.default.platform();
        const nodeVersion = process.version;
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalChannels = client.channels.cache.size;
        const embed = new componentV2_1.V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.bot} Hey, I'm ${client.user.username}`)
            .setDescription("> Modular, high-performance Discord management system.")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields({
            name: `${config.emojis.info} Identity`,
            value: [
                `• **Developer:** Vasudev AI Team`,
                `• **Name:** **${client.user.username}**`,
                `• **ID:** \`${process.env.CLIENT_ID || client.user.id}\``,
                `• **Created:** <t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`
            ].join("\n"),
            inline: false
        }, {
            name: `${config.emojis.stats} Statistics`,
            value: [
                `• **Servers:** ${totalGuilds.toLocaleString()}`,
                `• **Users:** ${totalUsers.toLocaleString()}`,
                `• **Channels:** ${totalChannels.toLocaleString()}`,
                `• **Ping:** ${client.ws.ping}ms`
            ].join("\n"),
            inline: true
        }, {
            name: `${config.emojis.settings} System`,
            value: [
                `• **Uptime:** ${days}d ${hours}h ${minutes}m ${seconds}s`,
                `• **Memory:** ${memoryUsage} MB / ${totalMemory} GB`,
                `• **Node.js:** ${nodeVersion}`,
                `• **Library:** v${discord_js_1.version}`
            ].join("\n"),
            inline: true
        })
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`, interaction.user.displayAvatarURL())
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setLabel("Invite Me")
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`), new discord_js_1.ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL("https://discord.gg/alpha"));
        yield interaction.reply(embed.toPayload({ extraComponents: [row] }));
    });
}
