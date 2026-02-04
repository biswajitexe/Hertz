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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const permission_1 = require("../../utilities/permission");
const ms_1 = __importDefault(require("ms"));
const modLogger_1 = require("../../utilities/modLogger");
const embedUtils_1 = require("../../utilities/embedUtils");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute (timeout) a user.')
    .addUserOption(option => option
    .setName('user')
    .setDescription('The user to mute.')
    .setRequired(true))
    .addStringOption(option => option
    .setName('duration')
    .setDescription('Duration (e.g. 1h, 30m, 1d) [Default: 10m].')
    .setRequired(false))
    .addStringOption(option => option
    .setName('reason')
    .setDescription('The reason for the mute.'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        const user = interaction.options.getMember('user');
        const rawDuration = interaction.options.getString('duration');
        const durationStr = rawDuration || "10m";
        const reason = interaction.options.getString('reason') || "No reason provided";
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ModerateMembers)) && interaction.user.id !== process.env.OWNER_ID) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You do not have permission to mute members.**")], ephemeral: true });
            return;
        }
        if (!user) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**Please provide a valid User.**\nUsage: `?mute <user> [duration] [reason]`")], ephemeral: true });
            return;
        }
        if (!(user instanceof discord_js_1.GuildMember)) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "User is not in the server.")], ephemeral: true });
            return;
        }
        if (user.id === interaction.user.id) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot mute yourself.**")], ephemeral: true });
            return;
        }
        if (user.id === interaction.client.user.id) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot mute me.**")], ephemeral: true });
            return;
        }
        if (user.id === interaction.guild.ownerId) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot mute the server owner.**")], ephemeral: true });
            return;
        }
        if (!user.moderatable) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**I cannot mute this user. My role is likely below theirs.**")], ephemeral: true });
            return;
        }
        if (!(0, permission_1.canModerate)(interaction.member, user, discord_js_1.PermissionFlagsBits.ModerateMembers)) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**You cannot moderate this user due to role hierarchy.**")], ephemeral: true });
            return;
        }
        let timeMs;
        try {
            timeMs = (0, ms_1.default)(durationStr);
            if (!timeMs || timeMs < 1000 || timeMs > 28 * 24 * 60 * 60 * 1000) {
                yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "Invalid duration. Must be between 1 second and 28 days. Example: `1h`, `30m`.")], ephemeral: true });
                return;
            }
        }
        catch (_b) {
            yield interaction.reply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "Invalid duration format.")], ephemeral: true });
            return;
        }
        yield interaction.deferReply();
        const durationFormatted = (0, ms_1.default)(timeMs, { long: true });
        try {
            yield user.timeout(timeMs, reason);
            const extraInfo = `**Duration**: ${durationFormatted}`;
            yield (0, modLogger_1.logAction)(interaction.guild, user.user, interaction.user, 'MUTE', reason, database, extraInfo);
            const successEmbed = (0, embedUtils_1.createSuccessEmbed)(interaction.user, `**Muted ${user.user.tag}**`)
                .addFields({ name: 'Reason', value: reason, inline: false });
            if (rawDuration) {
                successEmbed.addFields({ name: 'Duration', value: durationFormatted, inline: false });
            }
            yield interaction.editReply({ embeds: [successEmbed] });
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply({ embeds: [(0, embedUtils_1.createErrorEmbed)(interaction.user, "**Failed to mute user.**")] });
        }
    });
}
