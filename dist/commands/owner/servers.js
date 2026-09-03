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
    .setName('servers')
    .setDescription('Manage servers (Owner Only)')
    .addSubcommand(sub => sub.setName('list').setDescription('List top servers by member count'))
    .addSubcommand(sub => sub.setName('leave').setDescription('Force leave a server').addStringOption(opt => opt.setName('id').setDescription('Server ID').setRequired(true)))
    .addSubcommand(sub => sub.setName('invite').setDescription('Generate invite for a server').addStringOption(opt => opt.setName('id').setDescription('Server ID').setRequired(true)));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const botConfig = yield database.getBotConfig();
        const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.ownerUsers)
            owners.push(...botConfig.ownerUsers);
        if (!owners.includes(interaction.user.id))
            return interaction.reply((0, componentV2_1.createErrorV2)('Unknown command.').toPayload({ ephemeral: true }));
        const sub = interaction.options.getSubcommand();
        const embedStyle = (title, description, color = config.colors.primary) => {
            var _a;
            return new componentV2_1.V2Embed()
                .setColor(color)
                .setTitle(`<:74658vipglow:1465051133704798435> ${title}`)
                .setDescription(description)
                .setThumbnail(((_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || null)
                .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
        };
        if (sub === 'list') {
            const guilds = interaction.client.guilds.cache.sort((a, b) => b.memberCount - a.memberCount).first(10);
            const description = guilds.map((g, i) => `> \`${i + 1}.\` **${g.name}** \n> ID: \`${g.id}\` | Members: \`${g.memberCount}\` | Owner: <@${g.ownerId}>`).join('\n\n');
            const embed = embedStyle(`Top 10 Servers (${interaction.client.guilds.cache.size} Total)`, description);
            return interaction.reply(embed.toPayload({ ephemeral: true }));
        }
        if (sub === 'leave') {
            const id = interaction.options.getString('id', true);
            const guild = interaction.client.guilds.cache.get(id);
            if (!guild)
                return interaction.reply(embedStyle('Server Error', '> Bot is not in that server.', config.colors.error).toPayload({ ephemeral: true }));
            yield guild.leave();
            return interaction.reply(embedStyle('Left Server', `> Left **${guild.name}** (\`${id}\`).`, config.colors.success).toPayload({ ephemeral: true }));
        }
        if (sub === 'invite') {
            const id = interaction.options.getString('id', true);
            const guild = interaction.client.guilds.cache.get(id);
            if (!guild)
                return interaction.reply(embedStyle('Server Error', '> Bot is not in that server.', config.colors.error).toPayload({ ephemeral: true }));
            const channel = guild.channels.cache.find(c => {
                var _a;
                return c.type === discord_js_1.ChannelType.GuildText &&
                    ((_a = c.permissionsFor(guild.members.me)) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionsBitField.Flags.CreateInstantInvite));
            });
            if (!channel) {
                return interaction.reply(embedStyle('Invite Error', `> Could not find a channel to create invite in **${guild.name}**. Missing permissions?`, config.colors.error).toPayload({ ephemeral: true }));
            }
            try {
                const invite = yield channel.createInvite({ maxAge: 0, maxUses: 1 });
                return interaction.reply(embedStyle(`Invite for ${guild.name}`, `> [Click to Join](${invite.url})`).toPayload({ ephemeral: true }));
            }
            catch (e) {
                return interaction.reply(embedStyle('Invite Error', '> Failed to create invite.', config.colors.error).toPayload({ ephemeral: true }));
            }
        }
    });
}
