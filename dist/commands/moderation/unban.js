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
const embedUtils_1 = require("../../utilities/embedUtils");
const modLogger_1 = require("../../utilities/modLogger");
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server using their ID.')
    .addStringOption(option => option
    .setName('user_id')
    .setDescription('The ID of the user to unban.')
    .setRequired(true))
    .addStringOption(option => option
    .setName('reason')
    .setDescription('Reason for unbanning.'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        const userId = interaction.options.getString('user_id', true);
        const reason = interaction.options.getString('reason') || "No reason provided";
        if (!userId) {
            return interaction.reply((0, embedUtils_1.createErrorEmbed)(interaction.user, "**Please provide a valid User ID.**\nUsage: `?unban <user_id> [reason]`").toPayload({ ephemeral: true }));
        }
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.BanMembers)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply((0, componentV2_1.createErrorV2)("You do not have permission to unban members.").toPayload({ ephemeral: true }));
        }
        try {
            yield interaction.deferReply();
            const bannedUser = yield interaction.guild.bans.fetch(userId).catch(() => null);
            if (!bannedUser) {
                yield interaction.editReply((0, embedUtils_1.createErrorEmbed)(interaction.user, "**This user is not currently banned.**").toPayload());
                return;
            }
            yield interaction.guild.members.unban(userId, `[Unbanned by ${interaction.user.tag}] ${reason}`);
            yield (0, modLogger_1.logAction)(interaction.guild, bannedUser.user, interaction.user, 'UNBAN', reason, database);
            const embed = (0, embedUtils_1.createSuccessEmbed)(interaction.user, `**Unbanned ${bannedUser.user.tag}**`)
                .addFields({ name: 'Reason', value: reason, inline: false });
            yield interaction.editReply(embed.toPayload());
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply((0, embedUtils_1.createErrorEmbed)(interaction.user, "**Failed to unban user. ensure ID is correct.**").toPayload());
        }
    });
}
