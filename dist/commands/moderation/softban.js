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
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('softban')
    .setDescription('Kick a user and delete their messages (Soft Ban)')
    .addUserOption(option => option
    .setName('user')
    .setDescription('The user to softban.')
    .setRequired(true))
    .addStringOption(option => option
    .setName('reason')
    .setDescription('Reason for the softban.'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        const user = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || "No reason provided";
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.BanMembers)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply((0, componentV2_1.createErrorV2)("You do not have permission to ban members.").toPayload({ ephemeral: true }));
        }
        if (!user) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("User not found. Please mention a valid user.").toPayload({ ephemeral: true }));
            return;
        }
        if (!(user instanceof discord_js_1.GuildMember)) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("User is not in the server.").toPayload({ ephemeral: true }));
            return;
        }
        if (user.id === interaction.user.id) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot softban yourself.**").toPayload({ ephemeral: true }));
            return;
        }
        if (user.id === interaction.client.user.id) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot softban me.**").toPayload({ ephemeral: true }));
            return;
        }
        if (user.id === interaction.guild.ownerId) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot softban the server owner.**").toPayload({ ephemeral: true }));
            return;
        }
        if (!user.bannable) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**I cannot softban this user (My role is too low).**").toPayload({ ephemeral: true }));
            return;
        }
        if (!(0, permission_1.canModerate)(interaction.member, user, discord_js_1.PermissionFlagsBits.BanMembers)) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot moderate this user.**").toPayload({ ephemeral: true }));
            return;
        }
        yield interaction.deferReply();
        try {
            yield user.ban({ reason: `[Soft Ban] ${reason}`, deleteMessageSeconds: 7 * 24 * 60 * 60 });
            yield interaction.guild.members.unban(user.id, `Soft Ban Completed (Unbanning)`);
            yield (0, modLogger_1.logAction)(interaction.guild, user.user, interaction.user, 'BAN', `(Soft Ban) ${reason}`, database);
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.correct} Softbanned ${user.user.tag}`)
                .setDescription(`> User kicked and messages from the past 7 days have been removed.\n\n• **User:** ${user.user.tag} (\`${user.id}\`)\n• **Reason:** ${reason}`)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            yield interaction.editReply(embed.toPayload());
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply((0, componentV2_1.createErrorV2)("**Failed to softban user.**").toPayload());
        }
    });
}
