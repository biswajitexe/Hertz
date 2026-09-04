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
const permission_1 = require("../../utilities/permission");
const config = __importStar(require("../../config"));
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
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.correct} Unmuted ${user.user.tag}`)
                .setDescription(`> Successfully removed mute restriction from **${user.user.tag}**.\n\n• **User:** ${user.user.tag} (\`${user.id}\`)${reason !== "No reason provided" ? `\n• **Reason:** ${reason}` : ''}`)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            yield interaction.editReply(successEmbed.toPayload());
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply((0, componentV2_1.createErrorV2)("**Failed to unmute user.**").toPayload());
        }
    });
}
