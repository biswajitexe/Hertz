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
    .setName('noprefix')
    .setDescription('Manage No-Prefix users for this server.')
    .addSubcommand(subcommand => subcommand
    .setName('add')
    .setDescription('Add a user to No-Prefix list')
    .addUserOption(option => option.setName('user').setDescription('The user to add').setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('Remove a user from No-Prefix list')
    .addUserOption(option => option.setName('user').setDescription('The user to remove').setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('Show No-Prefix users'))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.inCachedGuild())
            return;
        let guildData = yield database.retrieveGuild(interaction.guild.id);
        if (!guildData)
            return interaction.reply({ content: "Database error.", ephemeral: true });
        const isBotOwner = interaction.user.id === process.env.OWNER_ID;
        if (!isBotOwner) {
            return interaction.reply({
                embeds: [new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Only the **Bot Owner** can manage No-Prefix users.`)],
                ephemeral: true
            });
        }
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'add') {
            const user = interaction.options.getUser('user', true);
            if (guildData.noPrefixUsers.includes(user.id)) {
                return interaction.reply({
                    embeds: [new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${user.tag}** is already in the No-Prefix list.`)],
                    ephemeral: true
                });
            }
            guildData.noPrefixUsers.push(user.id);
            yield database.insertGuild(interaction.guild.id, guildData);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.success)
                .setAuthor({ name: "No-Prefix Added", iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`${config.emojis.success} Successfully added **${user.tag}** to the No-Prefix list.\n${config.emojis.dot} They can now use commands without a prefix in this server.`)
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }
        if (subcommand === 'remove') {
            const user = interaction.options.getUser('user', true);
            if (!guildData.noPrefixUsers.includes(user.id)) {
                return interaction.reply({
                    embeds: [new discord_js_1.EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} **${user.tag}** is not in the No-Prefix list.`)],
                    ephemeral: true
                });
            }
            guildData.noPrefixUsers = guildData.noPrefixUsers.filter(id => id !== user.id);
            yield database.insertGuild(interaction.guild.id, guildData);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.error)
                .setAuthor({ name: "No-Prefix Removed", iconURL: interaction.user.displayAvatarURL() })
                .setDescription(`${config.emojis.delete} Successfully removed **${user.tag}** from the No-Prefix list.`)
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }
        if (subcommand === 'list') {
            const users = guildData.noPrefixUsers;
            if (users.length === 0) {
                return interaction.reply({
                    embeds: [new discord_js_1.EmbedBuilder().setColor(config.colors.warning).setDescription(`${config.emojis.warning} There are no No-Prefix users in this server.`)],
                    ephemeral: true
                });
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: `No-Prefix Users [${users.length}]`, iconURL: interaction.guild.iconURL() || undefined })
                .setDescription(users.map((id, index) => `${index + 1}. <@${id}> (\`${id}\`)`).join('\n'))
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() || undefined })
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }
    });
}
