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
    .setName('extraadmin')
    .setDescription('Manage users with Extra Admin privileges.')
    .addSubcommand(sub => sub
    .setName('add')
    .setDescription('Add a user as an Extra Admin.')
    .addUserOption(opt => opt.setName('user').setDescription('The user to add').setRequired(true)))
    .addSubcommand(sub => sub
    .setName('remove')
    .setDescription('Remove a user from Extra Admins.')
    .addUserOption(opt => opt.setName('user').setDescription('The user to remove').setRequired(true)))
    .addSubcommand(sub => sub
    .setName('show')
    .setDescription('Show all Extra Admins.'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        let guildData = yield database.retrieveGuild(interaction.guild.id);
        if (!guildData) {
            yield database.defaultGuild(interaction.guild);
            guildData = yield database.retrieveGuild(interaction.guild.id);
        }
        if (!guildData)
            return;
        if (!guildData.extraOwners)
            guildData.extraOwners = [];
        if (!guildData.extraAdmins)
            guildData.extraAdmins = [];
        const isOwner = interaction.user.id === interaction.guild.ownerId;
        const isExtraOwner = guildData.extraOwners.includes(interaction.user.id);
        if (!isOwner && !isExtraOwner) {
            yield interaction.reply({ content: `${config.emojis.error} **Only the Server Owner or Extra Owners can manage Extra Admins.**`, ephemeral: true });
            return;
        }
        const sub = interaction.options.getSubcommand();
        if (sub === 'add') {
            const user = interaction.options.getUser('user');
            if (!user) {
                yield interaction.reply({ content: `${config.emojis.error} **Please specify a user to add.**\nUsage: \`${config.prefix}extraadmin add <@user>\``, ephemeral: true });
                return;
            }
            if (guildData.extraAdmins.includes(user.id)) {
                yield interaction.reply({ content: `${config.emojis.error} **<@${user.id}> is already an Extra Admin.**`, ephemeral: true });
                return;
            }
            guildData.extraAdmins.push(user.id);
            yield database.insertGuild(interaction.guild.id, guildData);
            yield interaction.reply({ content: `${config.emojis.success} **Successfully added <@${user.id}> as an Extra Admin.**` });
        }
        else if (sub === 'remove') {
            const user = interaction.options.getUser('user');
            if (!user) {
                yield interaction.reply({ content: `${config.emojis.error} **Please specify a user to remove.**\nUsage: \`${config.prefix}extraadmin remove <@user>\``, ephemeral: true });
                return;
            }
            if (!guildData.extraAdmins.includes(user.id)) {
                yield interaction.reply({ content: `${config.emojis.error} **<@${user.id}> is not an Extra Admin.**`, ephemeral: true });
                return;
            }
            guildData.extraAdmins = guildData.extraAdmins.filter(id => id !== user.id);
            yield database.insertGuild(interaction.guild.id, guildData);
            yield interaction.reply({ content: `${config.emojis.success} **Successfully removed <@${user.id}> from Extra Admins.**` });
        }
        else if (sub === 'show') {
            const users = guildData.extraAdmins;
            const description = users.length > 0
                ? (yield Promise.all(users.map((id, i) => __awaiter(this, void 0, void 0, function* () {
                    const user = yield interaction.client.users.fetch(id).catch(() => null);
                    return `\`「${i + 1}」\` | \`${user ? user.username : 'Unknown'}「${id}」\``;
                })))).join('\n')
                : "**No Extra Admins set.**";
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: 'Extra Admins', iconURL: 'https://cdn.discordapp.com/emojis/1461692661562871962.png' })
                .setDescription(description)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            yield interaction.reply({ embeds: [embed] });
        }
        else {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('Extra Admin Commands')
                .setDescription(`\`${config.prefix}extraadmin add <user>\`\n` +
                `\`${config.prefix}extraadmin remove <user>\`\n` +
                `\`${config.prefix}extraadmin show\``)
                .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            yield interaction.reply({ embeds: [embed] });
        }
    });
}
