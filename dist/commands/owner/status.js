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
    .setName('status')
    .setDescription('Manage bot status (Owner Only)')
    .addSubcommand(sub => sub
    .setName('set')
    .setDescription('Set the bot presence')
    .addStringOption(opt => opt.setName('type').setDescription('Activity Type').setRequired(true)
    .addChoices({ name: 'Playing', value: 'Playing' }, { name: 'Watching', value: 'Watching' }, { name: 'Listening', value: 'Listening' }, { name: 'Competing', value: 'Competing' }, { name: 'Streaming', value: 'Streaming' }))
    .addStringOption(opt => opt.setName('text').setDescription('Status Text').setRequired(true)))
    .addSubcommand(sub => sub
    .setName('maintenance')
    .setDescription('Toggle maintenance mode')
    .addBooleanOption(opt => opt.setName('state').setDescription('Enable or Disable?').setRequired(true)));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        let botConfig = yield database.getBotConfig();
        const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.ownerUsers)
            owners.push(...botConfig.ownerUsers);
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.developerUsers)
            owners.push(...botConfig.developerUsers);
        if (!owners.includes(interaction.user.id))
            return interaction.reply((0, componentV2_1.createErrorV2)('Unknown command.').toPayload({ ephemeral: true }));
        const sub = interaction.options.getSubcommand();
        const embedStyle = (title, description, color = config.colors.default) => {
            var _a;
            return new componentV2_1.V2Embed()
                .setColor(color)
                .setTitle(`${config.emojis.settings} ${title}`)
                .setDescription(description)
                .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
        };
        if (sub === 'set') {
            const typeStr = interaction.options.getString('type', true);
            const text = interaction.options.getString('text', true);
            if (!typeStr || !text) {
                return interaction.reply((0, componentV2_1.createErrorV2)(`Usage: \`${config.prefix}status set <type> <text>\`\nTypes: Playing, Watching, Listening, Competing, Streaming`).toPayload({ ephemeral: true }));
            }
            let type = discord_js_1.ActivityType.Playing;
            if (typeStr === 'Watching')
                type = discord_js_1.ActivityType.Watching;
            if (typeStr === 'Listening')
                type = discord_js_1.ActivityType.Listening;
            if (typeStr === 'Competing')
                type = discord_js_1.ActivityType.Competing;
            if (typeStr === 'Streaming')
                type = discord_js_1.ActivityType.Streaming;
            (_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.setPresence({
                activities: [{ name: text, type: type }],
                status: 'online'
            });
            return interaction.reply(embedStyle('Status Updated', `> Status updated to **${typeStr} ${text}**.`, config.colors.success).toPayload({ ephemeral: true }));
        }
        if (sub === 'maintenance') {
            const state = interaction.options.getBoolean('state', true);
            if (!botConfig)
                botConfig = yield database.getBotConfig();
            botConfig.maintenance = state;
            yield database.insertBotConfig(botConfig);
            if (state) {
                (_b = interaction.client.user) === null || _b === void 0 ? void 0 : _b.setPresence({ status: 'dnd', activities: [{ name: 'Maintenance Mode', type: discord_js_1.ActivityType.Watching }] });
                return interaction.reply(embedStyle('Maintenance Enabled', `> **Maintenance Mode ENABLED.** Users cannot use commands.`, config.colors.warning).toPayload({ ephemeral: true }));
            }
            else {
                (_c = interaction.client.user) === null || _c === void 0 ? void 0 : _c.setPresence({ status: 'online', activities: [{ name: 'Ready', type: discord_js_1.ActivityType.Playing }] });
                return interaction.reply(embedStyle('Maintenance Disabled', `> **Maintenance Mode DISABLED.** Bot is live.`, config.colors.success).toPayload({ ephemeral: true }));
            }
        }
    });
}
