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
    .setName('autorole')
    .setDescription('Manage automatic roles for new members')
    .addSubcommandGroup(group => group.setName('humans')
    .setDescription('Manage autoroles for humans')
    .addSubcommand(sub => sub.setName('add')
    .setDescription('Add a role for humans')
    .addRoleOption(opt => opt.setName('role').setDescription('The role to add').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove')
    .setDescription('Remove a role for humans')
    .addRoleOption(opt => opt.setName('role').setDescription('The role to remove').setRequired(true))))
    .addSubcommandGroup(group => group.setName('bots')
    .setDescription('Manage autoroles for bots')
    .addSubcommand(sub => sub.setName('add')
    .setDescription('Add a role for bots')
    .addRoleOption(opt => opt.setName('role').setDescription('The role to add').setRequired(true)))
    .addSubcommand(sub => sub.setName('remove')
    .setDescription('Remove a role for bots')
    .addRoleOption(opt => opt.setName('role').setDescription('The role to remove').setRequired(true))))
    .addSubcommand(sub => sub.setName('show')
    .setDescription('Show all configured autoroles'))
    .addSubcommand(sub => sub.setName('reset')
    .setDescription('Clear all autoroles'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild)
            return;
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageRoles)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply((0, componentV2_1.createErrorV2)('You do not have permission to manage roles.').toPayload({ ephemeral: true }));
        }
        const guildId = interaction.guildId;
        let guildData = yield database.retrieveGuild(guildId);
        if (!guildData) {
            yield database.defaultGuild(interaction.guild);
            guildData = yield database.retrieveGuild(guildId);
            if (!guildData)
                return;
        }
        if (!guildData.autoroles)
            guildData.autoroles = [];
        if (!guildData.autorolesBots)
            guildData.autorolesBots = [];
        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand(false);
        if (!subcommand || subcommand === 'help') {
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.default)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setTitle(`${config.emojis.welcomer} Autorole Commands`)
                .setDescription(`${config.emojis.role} **Configure Auto-Roles for new members**\n\n` +
                `\`?autorole humans <add | remove> <role>\`\n` +
                `\`?autorole bots <add | remove> <role>\`\n` +
                `\`?autorole show\`\n` +
                `\`?autorole reset\``)
                .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
            return interaction.reply(embed.toPayload());
        }
        if (subcommand === 'show') {
            let activeType = 'humans';
            const getEmbed = (type) => {
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.default)
                    .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());
                if (type === 'humans') {
                    const list = guildData.autoroles.map((id, i) => `\`「${i + 1}」\` <@&${id}>`).join('\n') || "None";
                    embed.setAuthor('Autorole Humans', interaction.client.user.displayAvatarURL());
                    embed.setDescription(list);
                }
                else {
                    const list = guildData.autorolesBots.map((id, i) => `\`「${i + 1}」\` <@&${id}>`).join('\n') || "None";
                    embed.setAuthor('Autorole Bots', interaction.client.user.displayAvatarURL());
                    embed.setDescription(list);
                }
                return embed;
            };
            const getRow = (disabled = false) => new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('ar_show_humans').setLabel('Humans').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji(config.emojis.human).setDisabled(disabled), new discord_js_1.ButtonBuilder().setCustomId('ar_show_bots').setLabel('Bots').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji(config.emojis.bot).setDisabled(disabled));
            const reply = yield interaction.reply(getEmbed('humans').toPayload({ extraComponents: [getRow()] }));
            const collector = reply.createMessageComponentCollector({ componentType: discord_js_1.ComponentType.Button, time: 60000 });
            collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
                if (i.user.id !== interaction.user.id) {
                    yield i.reply((0, componentV2_1.createErrorV2)('Only the requester can use these buttons.').toPayload({ ephemeral: true }));
                    return;
                }
                if (i.customId === 'ar_show_humans') {
                    activeType = 'humans';
                    yield i.update(getEmbed('humans').toPayload({ extraComponents: [getRow()] }));
                }
                else if (i.customId === 'ar_show_bots') {
                    activeType = 'bots';
                    yield i.update(getEmbed('bots').toPayload({ extraComponents: [getRow()] }));
                }
            }));
            collector.on('end', () => {
                reply.edit(getEmbed(activeType).toPayload({ extraComponents: [getRow(true)] })).catch(() => { });
            });
            return;
        }
        if (subcommand === 'reset') {
            if (guildData.autoroles.length === 0 && guildData.autorolesBots.length === 0) {
                return interaction.reply((0, componentV2_1.createErrorV2)('Autorole configuration is already empty.').toPayload({ ephemeral: true }));
            }
            guildData.autoroles = [];
            guildData.autorolesBots = [];
            yield database.insertGuild(guildId, guildData);
            return interaction.reply((0, componentV2_1.createSuccessV2)('All autoroles (humans and bots) have been cleared.').toPayload());
        }
        const targetArray = subcommandGroup === 'bots' ? guildData.autorolesBots : guildData.autoroles;
        const typeName = subcommandGroup === 'bots' ? 'Bots' : 'Humans';
        const role = interaction.options.getRole('role', false);
        if (!role) {
            return interaction.reply((0, componentV2_1.createErrorV2)('Role not found. Please provide a valid Role or Role ID.').toPayload({ ephemeral: true }));
        }
        if (subcommand === 'add') {
            if (role.managed)
                return interaction.reply((0, componentV2_1.createErrorV2)('Cannot add managed roles.').toPayload({ ephemeral: true }));
            if (role.name === '@everyone' || role.id === interaction.guildId)
                return interaction.reply((0, componentV2_1.createErrorV2)('Cannot add everyone role.').toPayload({ ephemeral: true }));
            const botMember = yield interaction.guild.members.fetchMe();
            if (role.position >= botMember.roles.highest.position)
                return interaction.reply((0, componentV2_1.createErrorV2)('I cannot assign this role (it is higher than my highest role).').toPayload({ ephemeral: true }));
            if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== process.env.OWNER_ID) {
                const member = interaction.member;
                if (role.position >= member.roles.highest.position)
                    return interaction.reply((0, componentV2_1.createErrorV2)('You cannot assign a role higher or equal to your own.').toPayload({ ephemeral: true }));
            }
            if (targetArray.includes(role.id))
                return interaction.reply((0, componentV2_1.createErrorV2)(`Role is already an autorole for ${typeName}.`).toPayload({ ephemeral: true }));
            if (targetArray.length >= 10)
                return interaction.reply((0, componentV2_1.createErrorV2)('Max 10 autoroles allowed per category.').toPayload({ ephemeral: true }));
            targetArray.push(role.id);
            yield database.insertGuild(guildId, guildData);
            return interaction.reply((0, componentV2_1.createSuccessV2)(`Added ${role} to **${typeName}** autoroles.`).toPayload());
        }
        if (subcommand === 'remove') {
            if (!targetArray.includes(role.id))
                return interaction.reply((0, componentV2_1.createErrorV2)(`That role is not in the **${typeName}** autorole list.`).toPayload({ ephemeral: true }));
            const index = targetArray.indexOf(role.id);
            targetArray.splice(index, 1);
            yield database.insertGuild(guildId, guildData);
            return interaction.reply((0, componentV2_1.createSuccessV2)(`Removed ${role} from **${typeName}** autoroles.`).toPayload());
        }
    });
}
