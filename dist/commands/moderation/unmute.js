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
exports.aliases = exports.command = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const permission_1 = require("../../utilities/permission");
const embedUtils_1 = require("../../utilities/embedUtils");
const modLogger_1 = require("../../utilities/modLogger");
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute (remove timeout) a user.')
    .addUserOption(option => option
    .setName('user')
    .setDescription('The user to unmute.')
    .setRequired(true))
    .addStringOption(option => option
    .setName('reason')
    .setDescription('The reason for the unmute.'));
exports.aliases = ['untm', 'untimeout'];
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        const user = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || "No reason provided";
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ModerateMembers)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply((0, componentV2_1.createErrorV2)("You do not have permission to unmute members.").toPayload({ ephemeral: true }));
        }
        if (!user) {
            yield interaction.reply((0, embedUtils_1.createErrorEmbed)(interaction.user, "**Please provide a valid User.**\nUsage: `?unmute <user> [reason]`").toPayload({ ephemeral: true }));
            return;
        }
        if (!(user instanceof discord_js_1.GuildMember)) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("User is not in the server.").toPayload({ ephemeral: true }));
            return;
        }
        if (user.id === interaction.user.id) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot unmute yourself.**").toPayload({ ephemeral: true }));
            return;
        }
        if (!(0, permission_1.canModerate)(interaction.member, user, discord_js_1.PermissionFlagsBits.ModerateMembers)) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot moderate this user due to role hierarchy.**").toPayload({ ephemeral: true }));
            return;
        }
        if (!user.isCommunicationDisabled()) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**This user is not muted.**").toPayload({ ephemeral: true }));
            return;
        }
        yield interaction.deferReply();
        try {
            yield user.timeout(null, reason);
            yield (0, modLogger_1.logAction)(interaction.guild, user.user, interaction.user, 'UNMUTE', reason, database);
            const successEmbed = new componentV2_1.V2Embed()
                .setColor(0x57F287)
                .setTitle(`<:icocorrect46:1458159679988432948> Unmuted ${user.user.tag}`)
                .setDescription(`Successfully removed mute restriction from **${user.user.tag}**.`);
            if (reason !== "No reason provided") {
                successEmbed.addFields({ name: 'Reason', value: reason, inline: false });
            }
            yield interaction.editReply(successEmbed.toPayload());
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply((0, componentV2_1.createErrorV2)("**Failed to unmute user.**").toPayload());
        }
    });
}
