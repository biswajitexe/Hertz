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
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('setnick')
    .setDescription('Change a member\'s nickname')
    .addUserOption(option => option.setName('target')
    .setDescription('The member to change nickname for')
    .setRequired(false))
    .addStringOption(option => option.setName('nickname')
    .setDescription('The new nickname (leave empty to reset)')
    .setRequired(false)
    .setMaxLength(32))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageNicknames);
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (!interaction.guild)
            return;
        let targetUser = interaction.options.getUser('target');
        let nickname = interaction.options.getString('nickname');
        if (!targetUser) {
            const rawTargetStr = interaction.options.getString('target');
            const rawNicknameStr = interaction.options.getString('nickname');
            if (rawTargetStr && !targetUser) {
                if (rawNicknameStr) {
                    const potentialUserId = rawNicknameStr.replace(/[<@!&>]/g, '');
                    const potentialUser = yield interaction.guild.members.fetch(potentialUserId).then(m => m.user).catch(() => null);
                    if (potentialUser) {
                        targetUser = potentialUser;
                        nickname = rawTargetStr;
                    }
                }
            }
        }
        if (!targetUser) {
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.primary)
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL())
                .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                .setDescription(`\`${config.prefix}setnick <user> <name>\`\n\`${config.prefix}resetnick <user>\``)
                .setFooter(`Hertz • Advanced Moderation`, (_b = interaction.client.user) === null || _b === void 0 ? void 0 : _b.displayAvatarURL());
            return interaction.reply(embed.toPayload());
        }
        const member = yield interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member) {
            return interaction.reply((0, componentV2_1.createErrorV2)("Member not found.").toPayload({ ephemeral: true }));
        }
        if (!member.manageable) {
            return interaction.reply((0, componentV2_1.createErrorV2)("I cannot change this member's nickname (Role hierarchy).").toPayload({ ephemeral: true }));
        }
        try {
            yield member.setNickname(nickname || null);
            const embed = new componentV2_1.V2Embed()
                .setColor(0x57F287)
                .setTitle(`${config.emojis.success} Nickname Changed`)
                .setDescription(`Changed **${targetUser.tag}**'s nickname to **${nickname || "Default"}**.`);
            yield interaction.reply(embed.toPayload());
        }
        catch (err) {
            console.error(err);
            return interaction.reply((0, componentV2_1.createErrorV2)("Failed to change nickname.").toPayload({ ephemeral: true }));
        }
    });
}
