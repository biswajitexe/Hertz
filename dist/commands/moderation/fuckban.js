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
const permission_1 = require("../../utilities/permission");
const config = __importStar(require("../../config"));
const modLogger_1 = require("../../utilities/modLogger");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('fuckban')
    .setDescription('Aggressively ban a user (Hard Ban).')
    .addUserOption(option => option
    .setName('user')
    .setDescription('The user to fuckban.')
    .setRequired(true))
    .addStringOption(option => option
    .setName('reason')
    .setDescription('Reason for the ban.'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        let user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || "No reason provided (Just GTFO)";
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.BanMembers)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: `${config.emojis.error} You do not have permission to ban members.`, ephemeral: true });
        }
        if (!user) {
            return interaction.reply({ content: `${config.emojis.error} User/ID not found.`, ephemeral: true });
        }
        const member = yield interaction.guild.members.fetch(user.id).catch(() => null);
        if (member) {
            if (user.id === interaction.user.id) {
                yield interaction.reply({ content: `${config.emojis.error} **You cannot fuckban yourself.**`, ephemeral: true });
                return;
            }
            if (user.id === interaction.client.user.id) {
                yield interaction.reply({ content: `${config.emojis.error} **You cannot fuckban me.**`, ephemeral: true });
                return;
            }
            if (user.id === interaction.guild.ownerId) {
                yield interaction.reply({ content: `${config.emojis.error} **You cannot fuckban the server owner.**`, ephemeral: true });
                return;
            }
            if (!member.bannable) {
                yield interaction.reply({ content: `${config.emojis.error} **I cannot fuckban this user (My role is too low).**`, ephemeral: true });
                return;
            }
            if (!(0, permission_1.canModerate)(interaction.member, member, discord_js_1.PermissionFlagsBits.BanMembers)) {
                yield interaction.reply({ content: `${config.emojis.error} **You cannot moderate this user.**`, ephemeral: true });
                return;
            }
        }
        yield interaction.deferReply();
        try {
            const dm = new discord_js_1.EmbedBuilder()
                .setColor(0x000000)
                .setTitle(`GTFO from ${interaction.guild.name}`)
                .setDescription(`**You have been FUCK BANNED!**\nDon't ever come back.\n\n**Reason:** ${reason}`)
                .setImage('https://media.tenor.com/x8v1k5Ki3aEAAAAC/ban-hammer-discord.gif');
            yield user.send({ embeds: [dm] });
        }
        catch (e) { }
        try {
            yield interaction.guild.members.ban(user.id, { reason: `[FUCK BAN] ${reason}`, deleteMessageSeconds: 7 * 24 * 60 * 60 });
            yield (0, modLogger_1.logAction)(interaction.guild, user, interaction.user, 'BAN', `(FUCK BAN) ${reason}`, database);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle(`${config.emojis.error} BEGONE THOT!`)
                .setDescription(`**${user.tag}** has been obliterated from the server.`)
                .setImage('https://media.tenor.com/x8v1k5Ki3aEAAAAC/ban-hammer-discord.gif');
            if (reason !== "No reason provided (Just GTFO)") {
                embed.addFields({ name: 'Reason', value: reason, inline: false });
            }
            yield interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply({ content: `${config.emojis.error} **Failed to execute fuckban.**` });
        }
    });
}
