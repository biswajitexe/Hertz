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
            return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage roles.`, ephemeral: true });
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
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.primary)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setDescription(`<:rolemanager58:1464579329974603861> **Autorole Commands**\n\n` +
                `\`?autorole humans <add | remove> <role>\`\n` +
                `\`?autorole bots <add | remove> <role>\`\n` +
                `\`?autorole show\`\n` +
                `\`?autorole reset\``)
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            return interaction.reply({ embeds: [embed] });
        }
        if (subcommand === 'show') {
            const getEmbed = (type) => __awaiter(this, void 0, void 0, function* () {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
                if (type === 'humans') {
                    const list = guildData.autoroles.map((id, i) => `\`「${i + 1}」\` <@&${id}>`).join('\n') || "None";
                    embed.setAuthor({ name: 'Autorole Humans', iconURL: 'https://cdn.discordapp.com/emojis/1459604921451020472.png' });
                    embed.setDescription(list);
                }
                else {
                    const list = guildData.autorolesBots.map((id, i) => `\`「${i + 1}」\` <@&${id}>`).join('\n') || "None";
                    embed.setAuthor({ name: 'Autorole Bots', iconURL: 'https://cdn.discordapp.com/emojis/1464605545293025395.png' });
                    embed.setDescription(list);
                }
                return embed;
            });
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('ar_show_humans').setLabel('Humans').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('<:online:1458160864032194591>'), new discord_js_1.ButtonBuilder().setCustomId('ar_show_bots').setLabel('Bots').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('<:iconbot:1458160287290102008>'));
            const reply = yield interaction.reply({ embeds: [yield getEmbed('humans')], components: [row] });
            const collector = reply.createMessageComponentCollector({ componentType: discord_js_1.ComponentType.Button, time: 60000 });
            collector.on('collect', (i) => __awaiter(this, void 0, void 0, function* () {
                if (i.user.id !== interaction.user.id) {
                    yield i.reply({ content: `${config.emojis.error} **Only the requester can use these buttons.**`, ephemeral: true });
                    return;
                }
                if (i.customId === 'ar_show_humans')
                    yield i.update({ embeds: [yield getEmbed('humans')] });
                else if (i.customId === 'ar_show_bots')
                    yield i.update({ embeds: [yield getEmbed('bots')] });
            }));
            collector.on('end', () => {
                const disabledRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('ar_show_humans').setLabel('Humans').setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true).setEmoji('<:online:1458160864032194591>'), new discord_js_1.ButtonBuilder().setCustomId('ar_show_bots').setLabel('Bots').setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true).setEmoji('<:iconbot:1458160287290102008>'));
                reply.edit({ components: [disabledRow] }).catch(() => { });
            });
            return;
        }
        if (subcommand === 'reset') {
            if (guildData.autoroles.length === 0 && guildData.autorolesBots.length === 0) {
                return interaction.reply({ content: `${config.emojis.warning} Autorole configuration is already empty.`, ephemeral: true });
            }
            guildData.autoroles = [];
            guildData.autorolesBots = [];
            yield database.insertGuild(guildId, guildData);
            return interaction.reply(`${config.emojis.success} All autoroles (humans and bots) have been cleared.`);
        }
        const targetArray = subcommandGroup === 'bots' ? guildData.autorolesBots : guildData.autoroles;
        const typeName = subcommandGroup === 'bots' ? 'Bots' : 'Humans';
        const role = interaction.options.getRole('role', false);
        if (!role) {
            return interaction.reply({ content: `${config.emojis.error} Role not found. Please provide a valid Role or Role ID.`, ephemeral: true });
        }
        if (subcommand === 'add') {
            if (role.managed)
                return interaction.reply({ content: `${config.emojis.error} Cannot add managed roles.`, ephemeral: true });
            if (role.name === '@everyone' || role.id === interaction.guildId)
                return interaction.reply({ content: `${config.emojis.error} Cannot add everyone role.`, ephemeral: true });
            const botMember = yield interaction.guild.members.fetchMe();
            if (role.position >= botMember.roles.highest.position)
                return interaction.reply({ content: `${config.emojis.error} I cannot assign this role (it is higher than my highest role).`, ephemeral: true });
            if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== process.env.OWNER_ID) {
                const member = interaction.member;
                if (role.position >= member.roles.highest.position)
                    return interaction.reply({ content: `${config.emojis.error} You cannot assign a role higher or equal to your own.`, ephemeral: true });
            }
            if (targetArray.includes(role.id))
                return interaction.reply({ content: `${config.emojis.error} Role is already an autorole for ${typeName}.`, ephemeral: true });
            if (targetArray.length >= 10)
                return interaction.reply({ content: `${config.emojis.error} Max 10 autoroles allowed per category.`, ephemeral: true });
            targetArray.push(role.id);
            yield database.insertGuild(guildId, guildData);
            return interaction.reply(`${config.emojis.success} Added ${role} to **${typeName}** autoroles.`);
        }
        if (subcommand === 'remove') {
            if (!targetArray.includes(role.id))
                return interaction.reply({ content: `${config.emojis.error} That role is not in the **${typeName}** autorole list.`, ephemeral: true });
            const index = targetArray.indexOf(role.id);
            targetArray.splice(index, 1);
            yield database.insertGuild(guildId, guildData);
            return interaction.reply(`${config.emojis.success} Removed ${role} from **${typeName}** autoroles.`);
        }
    });
}
