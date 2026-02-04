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
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('badges')
    .setDescription('Manage Badges')
    .addSubcommand(sub => sub.setName('owner')
    .setDescription('Manage Bot Owners')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('developer')
    .setDescription('Manage Bot Developers')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('admin')
    .setDescription('Manage Bot Admins')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('staff')
    .setDescription('Manage Bot Staff')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('supporter')
    .setDescription('Manage Bot Supporters')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('noprefix')
    .setDescription('Manage No Prefix Users')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('premium')
    .setDescription('Manage Premium Users')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('vip')
    .setDescription('Manage VIP Users')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('partner')
    .setDescription('Manage Partner Users')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('early')
    .setDescription('Manage Early Supporters')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const botConfig = yield database.getBotConfig();
        const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.ownerUsers)
            owners.push(...botConfig.ownerUsers);
        const isOwner = owners.includes(interaction.user.id);
        const isAdmin = (_a = botConfig === null || botConfig === void 0 ? void 0 : botConfig.adminUsers) === null || _a === void 0 ? void 0 : _a.includes(interaction.user.id);
        if (!isOwner && !isAdmin) {
            return interaction.reply({ content: `${config.emojis.error} You do not have permission to use this command.`, ephemeral: true });
        }
        const subcommand = interaction.options.getSubcommand();
        const action = interaction.options.getString('action');
        const targetUser = interaction.options.getUser('user');
        if (!targetUser)
            return;
        const restrictedSubcommands = ['owner', 'developer', 'admin'];
        if (isAdmin && !isOwner && restrictedSubcommands.includes(subcommand)) {
            return interaction.reply({ content: `${config.emojis.error} Admins cannot manage **${subcommand}** badges. Ask an Owner.`, ephemeral: true });
        }
        let updated = false;
        let rankName = "";
        let emoji = "";
        const handleRole = (list, name, icon) => {
            rankName = name;
            emoji = icon;
            if (action === 'add') {
                if (!list.includes(targetUser.id)) {
                    list.push(targetUser.id);
                    updated = true;
                    return true;
                }
                return false;
            }
            else {
                if (list.includes(targetUser.id)) {
                    const index = list.indexOf(targetUser.id);
                    if (index > -1) {
                        list.splice(index, 1);
                        updated = true;
                        return true;
                    }
                }
                return false;
            }
        };
        let success = false;
        switch (subcommand) {
            case 'owner':
                if (!botConfig.ownerUsers)
                    botConfig.ownerUsers = [];
                success = handleRole(botConfig.ownerUsers, "Bot Owner", config.emojis.owner);
                break;
            case 'developer':
                if (!botConfig.developerUsers)
                    botConfig.developerUsers = [];
                success = handleRole(botConfig.developerUsers, "Bot Developer", config.emojis.developer);
                break;
            case 'admin':
                if (!botConfig.adminUsers)
                    botConfig.adminUsers = [];
                success = handleRole(botConfig.adminUsers, "Bot Admin", config.emojis.admin);
                break;
            case 'staff':
                if (!botConfig.staffUsers)
                    botConfig.staffUsers = [];
                success = handleRole(botConfig.staffUsers, "Bot Staff", config.emojis.staff);
                break;
            case 'supporter':
                if (!botConfig.supporterUsers)
                    botConfig.supporterUsers = [];
                success = handleRole(botConfig.supporterUsers, "Bot Supporter", config.emojis.supporter);
                break;
            case 'noprefix':
                if (!botConfig.noPrefixUsers)
                    botConfig.noPrefixUsers = [];
                success = handleRole(botConfig.noPrefixUsers, "No Prefix User", config.emojis.noprefix);
                if (success && action === 'add')
                    emoji = "<:3852diamond:1466392074189410421>";
                break;
            case 'premium':
                if (!botConfig.premiumUsers)
                    botConfig.premiumUsers = [];
                success = handleRole(botConfig.premiumUsers, "Premium User", config.emojis.noprefix);
                rankName = "Premium User";
                emoji = config.emojis.noprefix;
                break;
            case 'vip':
                if (!botConfig.vipUsers)
                    botConfig.vipUsers = [];
                success = handleRole(botConfig.vipUsers, "VIP User", config.emojis.vip);
                break;
            case 'partner':
                if (!botConfig.partnerUsers)
                    botConfig.partnerUsers = [];
                success = handleRole(botConfig.partnerUsers, "Bot Partner", config.emojis.partner);
                break;
            case 'early':
                if (!botConfig.earlyUsers)
                    botConfig.earlyUsers = [];
                success = handleRole(botConfig.earlyUsers, "Early Supporter", config.emojis.early);
                break;
        }
        if (updated) {
            yield database.updateBotConfig(botConfig);
            if (success) {
                if (action === 'add') {
                    yield interaction.reply({ content: `${config.emojis.success} Added **${targetUser.username}** to **${rankName}** ${emoji}.` });
                }
                else {
                    yield interaction.reply({ content: `${config.emojis.success} Removed **${targetUser.username}** from **${rankName}**.`, allowedMentions: { parse: [] } });
                }
            }
        }
        else {
            if (action === 'add') {
                yield interaction.reply({ content: `${config.emojis.warning} **${targetUser.username}** is already a **${rankName}**.`, ephemeral: true });
            }
            else {
                yield interaction.reply({ content: `${config.emojis.warning} **${targetUser.username}** is not a **${rankName}**.`, ephemeral: true });
            }
        }
    });
}
