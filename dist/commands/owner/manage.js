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
    .setName('manage')
    .setDescription('Manage bot roles (Owner Only)')
    .addSubcommand(sub => sub.setName('premium')
    .setDescription('Manage Premium Users')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('staff')
    .setDescription('Manage Bot Staff')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)))
    .addSubcommand(sub => sub.setName('noprefix')
    .setDescription('Manage No Prefix Users')
    .addStringOption(op => op.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
    .addUserOption(op => op.setName('user').setDescription('Target user').setRequired(true)));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: `${config.emojis.error} Only the **Bot Owner** can use this command.`, ephemeral: true });
        }
        const subcommand = interaction.options.getSubcommand();
        const action = interaction.options.getString('action');
        const targetUser = interaction.options.getUser('user');
        if (!targetUser)
            return;
        const botConfig = yield database.getBotConfig();
        let updated = false;
        if (subcommand === 'premium') {
            if (action === 'add') {
                if (!botConfig.premiumUsers.includes(targetUser.id)) {
                    botConfig.premiumUsers.push(targetUser.id);
                    updated = true;
                    yield interaction.reply({ content: `${config.emojis.success} Added **${targetUser.username}** to **Premium Users** ${config.emojis.noprefix}.` });
                }
                else {
                    yield interaction.reply({ content: `${config.emojis.warning} User is already Premium.`, ephemeral: true });
                }
            }
            else {
                if (botConfig.premiumUsers.includes(targetUser.id)) {
                    botConfig.premiumUsers = botConfig.premiumUsers.filter(id => id !== targetUser.id);
                    updated = true;
                    yield interaction.reply({ content: `${config.emojis.success} Removed **${targetUser.username}** from **Premium Users**.` });
                }
                else {
                    yield interaction.reply({ content: `${config.emojis.warning} User is not Premium.`, ephemeral: true });
                }
            }
        }
        else if (subcommand === 'staff') {
            if (!botConfig.staffUsers)
                botConfig.staffUsers = [];
            if (action === 'add') {
                if (!botConfig.staffUsers.includes(targetUser.id)) {
                    botConfig.staffUsers.push(targetUser.id);
                    updated = true;
                    yield interaction.reply({ content: `${config.emojis.success} Added **${targetUser.username}** to **Bot Staff** ${config.emojis.staff}.` });
                }
                else {
                    yield interaction.reply({ content: `${config.emojis.warning} User is already Staff.`, ephemeral: true });
                }
            }
            else {
                if (botConfig.staffUsers.includes(targetUser.id)) {
                    botConfig.staffUsers = botConfig.staffUsers.filter(id => id !== targetUser.id);
                    updated = true;
                    yield interaction.reply({ content: `${config.emojis.success} Removed **${targetUser.username}** from **Bot Staff**.` });
                }
                else {
                    yield interaction.reply({ content: `${config.emojis.warning} User is not Staff.`, ephemeral: true });
                }
            }
        }
        else if (subcommand === 'noprefix') {
            if (!botConfig.noPrefixUsers)
                botConfig.noPrefixUsers = [];
            if (action === 'add') {
                if (!botConfig.noPrefixUsers.includes(targetUser.id)) {
                    botConfig.noPrefixUsers.push(targetUser.id);
                    updated = true;
                    yield interaction.reply({ content: `${config.emojis.success} Added **${targetUser.username}** to **No Prefix Users**.` });
                }
                else {
                    yield interaction.reply({ content: `${config.emojis.warning} User is already No Prefix.`, ephemeral: true });
                }
            }
            else {
                if (botConfig.noPrefixUsers.includes(targetUser.id)) {
                    botConfig.noPrefixUsers = botConfig.noPrefixUsers.filter(id => id !== targetUser.id);
                    updated = true;
                    yield interaction.reply({ content: `${config.emojis.success} Removed **${targetUser.username}** from **No Prefix Users**.` });
                }
                else {
                    yield interaction.reply({ content: `${config.emojis.warning} User is not No Prefix.`, ephemeral: true });
                }
            }
        }
        if (updated) {
            yield database.updateBotConfig(botConfig);
        }
    });
}
