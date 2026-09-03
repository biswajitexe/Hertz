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
const modLogger_1 = require("../../utilities/modLogger");
const permission_1 = require("../../utilities/permission");
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('warnkick')
    .setDescription('Kick a user but send them an invite to rejoin (Warning Kick).')
    .addUserOption(option => option
    .setName('user')
    .setDescription('The user to warnkick.')
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
            return interaction.reply((0, componentV2_1.createErrorV2)("You do not have permission to kick members.").toPayload({ ephemeral: true }));
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
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot warnkick yourself.**").toPayload({ ephemeral: true }));
            return;
        }
        if (user.id === interaction.client.user.id) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot warnkick me.**").toPayload({ ephemeral: true }));
            return;
        }
        if (user.id === interaction.guild.ownerId) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot warnkick the server owner.**").toPayload({ ephemeral: true }));
            return;
        }
        if (!user.kickable) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**I cannot warnkick this user. My role is likely below theirs.**").toPayload({ ephemeral: true }));
            return;
        }
        if (!(0, permission_1.canModerate)(interaction.member, user, discord_js_1.PermissionFlagsBits.KickMembers)) {
            yield interaction.reply((0, componentV2_1.createErrorV2)("**You cannot warnkick this user due to role hierarchy.**").toPayload({ ephemeral: true }));
            return;
        }
        yield interaction.deferReply();
        let inviteUrl = "";
        try {
            const me = interaction.guild.members.me;
            if (me) {
                const channel = interaction.guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(me).has(discord_js_1.PermissionFlagsBits.CreateInstantInvite));
                if (channel) {
                    const invite = yield interaction.guild.invites.create(channel.id, { maxUses: 1, maxAge: 86400, unique: true, reason: `Warning Kick for ${user.user.tag}` });
                    inviteUrl = invite.url;
                }
            }
        }
        catch (error) {
            console.error("Failed to create invite for Warning Kick:", error);
        }
        try {
            const dmEmbed = new componentV2_1.V2Embed()
                .setColor(0xFEE75C)
                .setTitle(`You have been Warn-Kicked from ${interaction.guild.name}`)
                .setDescription(`**This is a Warning Kick.**\nYou have been removed but are allowed to rejoin. Please adhere to the rules.`)
                .addFields({ name: 'Reason', value: reason }, { name: 'Moderator', value: interaction.user.tag })
                .setTimestamp();
            if (inviteUrl) {
                dmEmbed.addFields({ name: 'Rejoin Link', value: `[**Click here to Rejoin**](${inviteUrl})` });
            }
            else {
                dmEmbed.addFields({ name: 'Rejoin', value: 'Please ask a friend for an invite.' });
            }
            yield user.send(dmEmbed.toPayload()).catch(() => { });
        }
        catch (_b) { }
        try {
            yield user.kick(reason);
            yield (0, modLogger_1.logAction)(interaction.guild, user.user, interaction.user, 'KICK', `(WarnKick) ${reason}`, database);
            const successEmbed = new componentV2_1.V2Embed()
                .setColor(config.colors.warning)
                .setTitle(`${config.emojis.success} Warning Kicked ${user.user.tag}`)
                .setDescription(`**User has been kicked with an invite sent to their DMs.**`)
                .setFooter(inviteUrl ? "Invite link sent in DM" : "Could not create invite link (Permissions?)");
            if (reason !== "No reason provided") {
                successEmbed.addFields({ name: 'Reason', value: reason, inline: false });
            }
            yield interaction.editReply(successEmbed.toPayload());
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply((0, componentV2_1.createErrorV2)("**Failed to kick user.**").toPayload());
        }
    });
}
