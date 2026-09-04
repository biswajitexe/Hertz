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
    .setName('staff')
    .setDescription('Manage Bot Staff')
    .addSubcommand(sub => sub.setName('add').setDescription('Add a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user').addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('list').setDescription('List all staff'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        const botConfig = yield database.getBotConfig();
        const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.ownerUsers)
            owners.push(...botConfig.ownerUsers);
        const isOwner = owners.includes(interaction.user.id);
        const isAdmin = (_a = botConfig === null || botConfig === void 0 ? void 0 : botConfig.adminUsers) === null || _a === void 0 ? void 0 : _a.includes(interaction.user.id);
        if (!isOwner && !isAdmin) {
            return interaction.reply((0, componentV2_1.createErrorV2)('You do not have permission to use this command.').toPayload({ ephemeral: true }));
        }
        const subcommand = interaction.options.getSubcommand(false);
        if (!botConfig.staffUsers)
            botConfig.staffUsers = [];
        const embedStyle = (title, description) => {
            var _a;
            return new componentV2_1.V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.staff} ${title}`)
                .setDescription(description)
                .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
        };
        if (subcommand === 'add') {
            const targetUser = interaction.options.getUser('user', true);
            if (botConfig.staffUsers.includes(targetUser.id)) {
                return interaction.reply((0, componentV2_1.createErrorV2)(`**${targetUser.tag}** is already **Staff**.`).toPayload());
            }
            botConfig.staffUsers.push(targetUser.id);
            yield database.updateBotConfig(botConfig);
            return interaction.reply(embedStyle('Staff Added', `> Added **${targetUser.tag}** as **Bot Staff**.\n\n${config.emojis.lock} **Authorization granted.**`).toPayload());
        }
        if (subcommand === 'remove') {
            const targetUser = interaction.options.getUser('user', true);
            if (!botConfig.staffUsers.includes(targetUser.id)) {
                return interaction.reply((0, componentV2_1.createErrorV2)(`**${targetUser.tag}** is not **Staff**.`).toPayload());
            }
            botConfig.staffUsers = botConfig.staffUsers.filter(id => id !== targetUser.id);
            yield database.updateBotConfig(botConfig);
            return interaction.reply(embedStyle('Staff Removed', `> Removed **${targetUser.tag}** from **Bot Staff**.`).toPayload());
        }
        if (subcommand === 'list') {
            const users = botConfig.staffUsers;
            if (users.length === 0)
                return interaction.reply((0, componentV2_1.createWarningV2)('No Staff found.').toPayload());
            const names = yield Promise.all(users.map((id) => __awaiter(this, void 0, void 0, function* () {
                try {
                    return (yield interaction.client.users.fetch(id)).username;
                }
                catch (_a) {
                    return `Unknown (${id})`;
                }
            })));
            const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
            return interaction.reply(embedStyle('Bot Staff', list).toPayload());
        }
        const embed = embedStyle('Staff Commands', `\`${config.prefix}staff add <user>\`\n` +
            `\`${config.prefix}staff remove <user>\`\n` +
            `\`${config.prefix}staff list\``);
        return interaction.reply(embed.toPayload());
    });
}
