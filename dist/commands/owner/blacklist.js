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
    .setName('blacklist')
    .setDescription('Manage global blacklists (Owner Only)')
    .addSubcommand(sub => sub
    .setName('user')
    .setDescription('Blacklist a user')
    .addStringOption(opt => opt.setName('id').setDescription('User ID').setRequired(true))
    .addBooleanOption(opt => opt.setName('remove').setDescription('Remove from blacklist? (Default: false)')))
    .addSubcommand(sub => sub
    .setName('server')
    .setDescription('Blacklist a server')
    .addStringOption(opt => opt.setName('id').setDescription('Server ID').setRequired(true))
    .addBooleanOption(opt => opt.setName('remove').setDescription('Remove from blacklist? (Default: false)')));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const botConfig = yield database.getBotConfig();
        const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.ownerUsers)
            owners.push(...botConfig.ownerUsers);
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.adminUsers)
            owners.push(...botConfig.adminUsers);
        if (!owners.includes(interaction.user.id))
            return interaction.reply((0, componentV2_1.createErrorV2)('Unknown command.').toPayload({ ephemeral: true }));
        const sub = interaction.options.getSubcommand();
        const id = interaction.options.getString('id', true);
        const remove = interaction.options.getBoolean('remove') || false;
        const embedStyle = (title, description, color = config.colors.default) => {
            var _a;
            return new componentV2_1.V2Embed()
                .setColor(color)
                .setTitle(`${config.emojis.owner} ${title}`)
                .setDescription(description)
                .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
        };
        if (sub === 'user') {
            if (remove) {
                if (!botConfig.blacklistedUsers.includes(id)) {
                    return interaction.reply(embedStyle('Blacklist Error', `> User is not blacklisted.`, config.colors.error).toPayload({ ephemeral: true }));
                }
                botConfig.blacklistedUsers = botConfig.blacklistedUsers.filter(u => u !== id);
                yield database.insertBotConfig(botConfig);
                return interaction.reply(embedStyle('User Removed', `> User \`${id}\` removed from blacklist.`).toPayload({ ephemeral: true }));
            }
            else {
                if (botConfig.blacklistedUsers.includes(id)) {
                    return interaction.reply(embedStyle('Blacklist Error', `> User is already blacklisted.`, config.colors.error).toPayload({ ephemeral: true }));
                }
                botConfig.blacklistedUsers.push(id);
                yield database.insertBotConfig(botConfig);
                return interaction.reply(embedStyle('User Blacklisted', `> User \`${id}\` added to global blacklist.`).toPayload({ ephemeral: true }));
            }
        }
        if (sub === 'server') {
            if (remove) {
                if (!botConfig.blacklistedGuilds.includes(id)) {
                    return interaction.reply(embedStyle('Blacklist Error', `> Server is not blacklisted.`, config.colors.error).toPayload({ ephemeral: true }));
                }
                botConfig.blacklistedGuilds = botConfig.blacklistedGuilds.filter(g => g !== id);
                yield database.insertBotConfig(botConfig);
                return interaction.reply(embedStyle('Server Removed', `> Server \`${id}\` removed from blacklist.`).toPayload({ ephemeral: true }));
            }
            else {
                if (botConfig.blacklistedGuilds.includes(id)) {
                    return interaction.reply(embedStyle('Blacklist Error', `> Server is already blacklisted.`, config.colors.error).toPayload({ ephemeral: true }));
                }
                botConfig.blacklistedGuilds.push(id);
                yield database.insertBotConfig(botConfig);
                const guild = interaction.client.guilds.cache.get(id);
                if (guild) {
                    yield guild.leave().catch(() => { });
                    return interaction.reply(embedStyle('Server Blacklisted', `> Server \`${id}\` blacklisted and forced left.`).toPayload({ ephemeral: true }));
                }
                return interaction.reply(embedStyle('Server Blacklisted', `> Server \`${id}\` added to global blacklist.`).toPayload({ ephemeral: true }));
            }
        }
    });
}
