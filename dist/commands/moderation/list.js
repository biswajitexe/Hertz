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
const pagination_1 = require("../../utilities/pagination");
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('list')
    .setDescription('List roles, bots, admins, or members in a role.')
    .addSubcommand(sub => sub.setName('roles').setDescription('List all roles in the server'))
    .addSubcommand(sub => sub.setName('bots').setDescription('List all bots in the server'))
    .addSubcommand(sub => sub.setName('admins').setDescription('List all admins in the server'))
    .addSubcommand(sub => sub.setName('inrole')
    .setDescription('List members in a specific role')
    .addRoleOption(opt => opt.setName('role').setDescription('The role to check').setRequired(true)))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages);
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.inCachedGuild())
            return;
        let subcommand = null;
        let targetRole = null;
        try {
            subcommand = interaction.options.getSubcommand();
            targetRole = interaction.options.getRole('role');
        }
        catch (e) { }
        if (!subcommand) {
            const msg = interaction;
            if (msg.content) {
                const args = msg.content.trim().split(/ +/);
                const rawSub = (_a = args[1]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                if (['role', 'roles'].includes(rawSub))
                    subcommand = 'roles';
                else if (['bot', 'bots'].includes(rawSub))
                    subcommand = 'bots';
                else if (['admin', 'admins'].includes(rawSub))
                    subcommand = 'admins';
                else if (['inrole', 'members'].includes(rawSub)) {
                    subcommand = 'inrole';
                    const roleQuery = args.slice(2).join(' ');
                    if (roleQuery) {
                        targetRole = interaction.guild.roles.cache.find(r => r.id === roleQuery || r.name.toLowerCase() === roleQuery.toLowerCase() || r.toString() === roleQuery) || null;
                    }
                }
            }
        }
        if (!subcommand) {
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.info} Server Lists`)
                .setDescription(`> View categorized server members and entities.\n\n• **Roles:** \`${config.prefix}list roles\`\n• **Bots:** \`${config.prefix}list bots\`\n• **Admins:** \`${config.prefix}list admins\`\n• **In Role:** \`${config.prefix}list inrole <role>\``)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            yield interaction.reply(embed.toPayload());
            return;
        }
        yield interaction.deferReply();
        const getFormattedList = (items) => {
            return items.map((item, i) => `\`「${i + 1}」\` | \`${item.name}「${item.id}」\`${item.extra ? ` (${item.extra})` : ''}`);
        };
        const icon = 'https://cdn.discordapp.com/emojis/1461641597476274332.png';
        try {
            let items = [];
            let title = '';
            if (subcommand === 'roles') {
                title = 'Server Roles';
                items = interaction.guild.roles.cache
                    .sort((a, b) => b.position - a.position)
                    .map(r => ({ name: r.name, id: r.id, extra: `${r.members.size} members` }));
            }
            else if (subcommand === 'bots') {
                title = 'Server Bots';
                const fetchedMembers = yield interaction.guild.members.fetch();
                items = fetchedMembers
                    .filter(m => m.user.bot)
                    .map(m => ({ name: m.user.username, id: m.id }));
            }
            else if (subcommand === 'admins') {
                title = 'Server Admins';
                const fetchedMembers = yield interaction.guild.members.fetch();
                items = fetchedMembers
                    .filter(m => m.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) && !m.user.bot)
                    .map(m => ({ name: m.user.username, id: m.id }));
            }
            else if (subcommand === 'inrole') {
                if (!targetRole) {
                    yield interaction.editReply((0, componentV2_1.createErrorV2)("**Please specify a valid role.**").toPayload());
                    return;
                }
                title = `Members in ${targetRole.name}`;
                yield interaction.guild.members.fetch();
                items = targetRole.members.map(m => ({ name: m.user.username, id: m.id }));
            }
            const formattedLines = getFormattedList(items);
            yield (0, pagination_1.pagination)(interaction, title, formattedLines, 10, icon);
        }
        catch (err) {
            console.error(err);
            yield interaction.editReply((0, componentV2_1.createErrorV2)("Failed to fetch list.").toPayload());
        }
    });
}
