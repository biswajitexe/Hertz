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
    .setName('premium')
    .setDescription('Manage premium access (Owner Only)')
    .addSubcommand(sub => sub
    .setName('add')
    .setDescription('Add premium access')
    .addStringOption(opt => opt.setName('id').setDescription('User or Server ID').setRequired(true))
    .addStringOption(opt => opt.setName('type').setDescription('User or Server?').setRequired(true).addChoices({ name: 'User', value: 'user' }, { name: 'Server', value: 'server' })))
    .addSubcommand(sub => sub
    .setName('remove')
    .setDescription('Remove premium access')
    .addStringOption(opt => opt.setName('id').setDescription('User or Server ID').setRequired(true))
    .addStringOption(opt => opt.setName('type').setDescription('User or Server?').setRequired(true).addChoices({ name: 'User', value: 'user' }, { name: 'Server', value: 'server' })));
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
        const type = interaction.options.getString('type', true);
        const embedStyle = (title, description, color = config.colors.default) => {
            return new componentV2_1.V2Embed()
                .setColor(color)
                .setTitle(`${config.emojis.premium} ${title}`)
                .setDescription(description)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        };
        if (sub === 'add') {
            if (type === 'user') {
                if (botConfig.premiumUsers.includes(id))
                    return interaction.reply(embedStyle('Premium Error', `> User is already premium.`, config.colors.default).toPayload({ ephemeral: true }));
                botConfig.premiumUsers.push(id);
                yield database.insertBotConfig(botConfig);
                return interaction.reply(embedStyle('User Added', `> User <@${id}> added to **Premium Users**.\n\n${config.emojis.lock} **Premium activated.**`, config.colors.default).toPayload({ ephemeral: true }));
            }
            else {
                if (botConfig.premiumGuilds.includes(id))
                    return interaction.reply(embedStyle('Premium Error', `> Server is already premium.`, config.colors.default).toPayload({ ephemeral: true }));
                botConfig.premiumGuilds.push(id);
                yield database.insertBotConfig(botConfig);
                return interaction.reply(embedStyle('Server Added', `> Server \`${id}\` added to **Premium Servers**.\n\n${config.emojis.lock} **Premium activated.**`, config.colors.default).toPayload({ ephemeral: true }));
            }
        }
        if (sub === 'remove') {
            if (type === 'user') {
                botConfig.premiumUsers = botConfig.premiumUsers.filter(u => u !== id);
                yield database.insertBotConfig(botConfig);
                return interaction.reply(embedStyle('User Removed', `> User <@${id}> removed from Premium.`, config.colors.success).toPayload({ ephemeral: true }));
            }
            else {
                botConfig.premiumGuilds = botConfig.premiumGuilds.filter(g => g !== id);
                yield database.insertBotConfig(botConfig);
                return interaction.reply(embedStyle('Server Removed', `> Server \`${id}\` removed from Premium.`, config.colors.success).toPayload({ ephemeral: true }));
            }
        }
    });
}
