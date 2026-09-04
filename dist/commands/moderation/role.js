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
    .setName('role')
    .setDescription('Manage user roles (Toggle)')
    .addUserOption(option => option.setName('user').setDescription('The user').setRequired(false))
    .addRoleOption(option => option.setName('role').setDescription('The role').setRequired(false));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild)
            return;
        let targetUser = interaction.options.getUser('user');
        let role = interaction.options.getRole('role');
        if (!targetUser || !role) {
            const rawUserArg = interaction.options.getString('user');
            const rawRoleArg = interaction.options.getString('role');
            if (rawUserArg && rawRoleArg) {
                const swappedRole = yield interaction.guild.roles.fetch(rawUserArg).catch(() => null);
                const swappedUser = yield interaction.guild.members.fetch(rawRoleArg).then(m => m.user).catch(() => null);
                if (swappedRole && swappedUser) {
                    role = swappedRole;
                    targetUser = swappedUser;
                }
            }
        }
        if (!targetUser || !role) {
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.roles} Role Management`)
                .setDescription(`> Easily toggle or manage user roles.\n\n• **Usage:** \`${config.prefix}role <user> <role>\`\n• **Alternative:** \`${config.prefix}role <role> <user>\``)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            return interaction.reply(embed.toPayload());
        }
        const member = yield interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!member)
            return interaction.reply((0, componentV2_1.createErrorV2)("Member not found.").toPayload({ ephemeral: true }));
        const botMember = yield interaction.guild.members.fetchMe();
        if (role.position >= botMember.roles.highest.position) {
            return interaction.reply((0, componentV2_1.createErrorV2)("I cannot manage this role (it is higher or equal to my highest role).").toPayload({ ephemeral: true }));
        }
        if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== process.env.OWNER_ID) {
            const executor = interaction.member;
            if (role.position >= executor.roles.highest.position) {
                return interaction.reply((0, componentV2_1.createErrorV2)("You cannot manage this role (it is higher or equal to your highest role).").toPayload({ ephemeral: true }));
            }
        }
        try {
            if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageRoles)) && interaction.user.id !== process.env.OWNER_ID) {
                return interaction.reply((0, componentV2_1.createErrorV2)("You do not have permission to manage roles.").toPayload({ ephemeral: true }));
            }
            if (member.roles.cache.has(role.id)) {
                yield member.roles.remove(role.id);
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.default)
                    .setTitle(`${config.emojis.correct} Role Removed`)
                    .setDescription(`> Successfully removed role from member.\n\n• **User:** ${targetUser.tag} (\`${targetUser.id}\`)\n• **Role:** ${role.name}`)
                    .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
                return interaction.reply(embed.toPayload());
            }
            else {
                yield member.roles.add(role.id);
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.default)
                    .setTitle(`${config.emojis.correct} Role Added`)
                    .setDescription(`> Successfully added role to member.\n\n• **User:** ${targetUser.tag} (\`${targetUser.id}\`)\n• **Role:** ${role.name}`)
                    .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
                return interaction.reply(embed.toPayload());
            }
        }
        catch (err) {
            console.error(err);
            return interaction.reply((0, componentV2_1.createErrorV2)("Failed to manage role.").toPayload({ ephemeral: true }));
        }
    });
}
