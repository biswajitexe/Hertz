"use strict";
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
const modLogger_1 = require("../../utilities/modLogger");
const embedUtils_1 = require("../../utilities/embedUtils");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption(option => option
    .setName('user')
    .setDescription('The user to kick.')
    .setRequired(true))
    .addStringOption(option => option
    .setName('reason')
    .setDescription('The reason for the kick.'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        const user = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || "No reason provided";
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.KickMembers)) && interaction.user.id !== process.env.OWNER_ID) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You do not have permission to kick members.**")], ephemeral: true });
            return;
        }
        if (!user) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**Please provide a valid User.**\nUsage: `?kick <user> [reason]`")], ephemeral: true });
            return;
        }
        if (!(user instanceof discord_js_1.GuildMember)) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "User is not in the server.")], ephemeral: true });
            return;
        }
        if (user.id === interaction.user.id) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot kick yourself.**")], ephemeral: true });
            return;
        }
        if (user.id === interaction.client.user.id) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot kick me.**")], ephemeral: true });
            return;
        }
        if (user.id === interaction.guild.ownerId) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot kick the server owner.**")], ephemeral: true });
            return;
        }
        if (!user.kickable) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**I cannot kick this user. My role is likely below theirs.**")], ephemeral: true });
            return;
        }
        if (!(0, permission_1.canModerate)(interaction.member, user, discord_js_1.PermissionFlagsBits.KickMembers)) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot kick this user due to role hierarchy.**")], ephemeral: true });
            return;
        }
        yield interaction.deferReply();
        try {
            const dmEmbed = (0, embedUtils_1.createErrorEmbed)(interaction.user, `You have been kicked from **${interaction.guild.name}**`)
                .setTitle(`You have been kicked from ${interaction.guild.name}`)
                .setDescription(null)
                .addFields({ name: 'Reason', value: reason }, { name: 'Moderator', value: interaction.user.tag });
            yield user.send({ embeds: [dmEmbed] });
        }
        catch (e) { }
        try {
            yield user.kick(reason);
            yield (0, modLogger_1.logAction)(interaction.guild, user.user, interaction.user, 'KICK', reason, database);
            const successEmbed = (0, embedUtils_1.createSuccessEmbed)(interaction.user, `**Kicked ${user.user.tag}**`)
                .addFields({ name: 'Reason', value: reason, inline: false });
            yield interaction.editReply({ embeds: [successEmbed] });
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**Failed to kick user.**")] });
        }
    });
}
