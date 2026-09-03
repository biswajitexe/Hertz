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
exports.aliases = exports.command = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('noprefix')
    .setDescription('Manage No-Prefix users for this server.')
    .addSubcommand(subcommand => subcommand
    .setName('add')
    .setDescription('Add a user to No-Prefix list')
    .addUserOption(option => option.setName('user').setDescription('The user to add').setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('Remove a user from No-Prefix list')
    .addUserOption(option => option.setName('user').setDescription('The user to remove').setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('Show No-Prefix users'))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
exports.aliases = ['np'];
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.inCachedGuild())
            return;
        const botConfig = yield database.getBotConfig();
        const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.ownerUsers)
            owners.push(...botConfig.ownerUsers);
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.developerUsers)
            owners.push(...botConfig.developerUsers);
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.adminUsers)
            owners.push(...botConfig.adminUsers);
        if (!owners.includes(interaction.user.id)) {
            return interaction.reply((0, componentV2_1.createErrorV2)('Only the **Bot Owner** can manage No-Prefix users.').toPayload({ ephemeral: true }));
        }
        const subcommand = interaction.options.getSubcommand();
        const embedStyle = (title, description) => {
            var _a;
            return new componentV2_1.V2Embed()
                .setColor(config.colors.primary)
                .setTitle(`<:3852diamond:1466392074189410421> ${title}`)
                .setDescription(description)
                .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
        };
        if (!botConfig.noPrefixUsers)
            botConfig.noPrefixUsers = [];
        if (subcommand === 'add') {
            const user = interaction.options.getUser('user', true);
            if (botConfig.noPrefixUsers.includes(user.id)) {
                return interaction.reply((0, componentV2_1.createErrorV2)(`**${user.tag}** is already in the No-Prefix list.`).toPayload({ ephemeral: true }));
            }
            botConfig.noPrefixUsers.push(user.id);
            yield database.updateBotConfig(botConfig);
            const embed = embedStyle('No Prefix Added', `> Added **${user.tag}** to the No-Prefix list.\n> They can now use commands without a prefix globally.\n\n<:6581lockkey:1461100873479487559> **Authorization granted.**`);
            return interaction.reply(embed.toPayload());
        }
        if (subcommand === 'remove') {
            const user = interaction.options.getUser('user', true);
            if (!botConfig.noPrefixUsers.includes(user.id)) {
                return interaction.reply((0, componentV2_1.createErrorV2)(`**${user.tag}** is not in the No-Prefix list.`).toPayload({ ephemeral: true }));
            }
            botConfig.noPrefixUsers = botConfig.noPrefixUsers.filter(id => id !== user.id);
            yield database.updateBotConfig(botConfig);
            const embed = embedStyle('No Prefix Removed', `> Removed **${user.tag}** from the No-Prefix list.`);
            return interaction.reply(embed.toPayload());
        }
        if (subcommand === 'list') {
            const users = botConfig.noPrefixUsers;
            if (users.length === 0) {
                return interaction.reply((0, componentV2_1.createWarningV2)('There are no No-Prefix users.').toPayload({ ephemeral: true }));
            }
            const names = yield Promise.all(users.map((id) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const user = yield interaction.client.users.fetch(id);
                    return user.username;
                }
                catch (_a) {
                    return `Unknown (${id})`;
                }
            })));
            const list = names.map((name, i) => `\`「${i + 1}」\` | \`${name}「${users[i]}」\``).join('\n');
            const embed = embedStyle('No Prefix Users', list);
            return interaction.reply(embed.toPayload());
        }
        const embed = embedStyle('No Prefix Commands', `\`${config.prefix}noprefix add <user>\`\n` +
            `\`${config.prefix}noprefix remove <user>\`\n` +
            `\`${config.prefix}noprefix list\``);
        return interaction.reply(embed.toPayload());
    });
}
