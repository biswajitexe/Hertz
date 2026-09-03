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
const embedUtils_1 = require("../../utilities/embedUtils");
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('resetnick')
    .setDescription('Reset a member\'s nickname to their username')
    .addUserOption(option => option.setName('user')
    .setDescription('The member to reset nickname for')
    .setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageNicknames);
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.inCachedGuild())
            return;
        const targetUser = interaction.options.getMember('user');
        if (!targetUser) {
            yield interaction.reply((0, embedUtils_1.createErrorEmbed)(interaction.user, "**Please provide a valid User.**").toPayload({ ephemeral: true }));
            return;
        }
        if (!(targetUser instanceof discord_js_1.GuildMember)) {
            yield interaction.reply((0, embedUtils_1.createErrorEmbed)(interaction.user, "Target is not a member of this server.").toPayload({ ephemeral: true }));
            return;
        }
        if (!targetUser.manageable) {
            return interaction.reply((0, componentV2_1.createErrorV2)("I cannot change this member's nickname (Role hierarchy).").toPayload({ ephemeral: true }));
        }
        try {
            yield targetUser.setNickname(null);
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.success)
                .setTitle(`${config.emojis.success} Nickname Reset`)
                .setDescription(`Reset **${targetUser.user.tag}**'s nickname.`);
            yield interaction.reply(embed.toPayload());
        }
        catch (err) {
            console.error(err);
            return interaction.reply((0, componentV2_1.createErrorV2)("Failed to reset nickname.").toPayload({ ephemeral: true }));
        }
    });
}
