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
    .setName('prefix')
    .setDescription('Manage custom prefix for this server.')
    .addSubcommand(subcommand => subcommand
    .setName('set')
    .setDescription('Set a custom prefix')
    .addStringOption(option => option.setName('new_prefix').setDescription('The new prefix to set').setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('reset')
    .setDescription('Reset prefix to default'))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild);
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.inCachedGuild())
            return;
        const sub = interaction.options.getSubcommand();
        const guild = yield database.retrieveGuild(interaction.guildId);
        if (!guild)
            return;
        const embedStyle = (title, description, color = config.colors.default) => {
            return new componentV2_1.V2Embed()
                .setColor(color)
                .setTitle(`${config.emojis.pin} ${title}`)
                .setDescription(description)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        };
        if (sub === 'set') {
            const newPrefix = interaction.options.getString('new_prefix', true);
            if (newPrefix.length > 5) {
                return interaction.reply(embedStyle('Prefix Error', `> ${config.emojis.wrong} Prefix cannot be longer than 5 characters.`, config.colors.default).toPayload({ ephemeral: true }));
            }
            guild.prefix = newPrefix;
            yield database.insertGuild(interaction.guildId, guild);
            return interaction.reply(embedStyle('Prefix Updated', `> Successfully set custom server prefix.\n\n• **New Prefix:** \`${newPrefix}\`\n• **Example:** \`${newPrefix}help\``, config.colors.default).toPayload());
        }
        if (sub === 'reset') {
            guild.prefix = null;
            yield database.insertGuild(interaction.guildId, guild);
            return interaction.reply(embedStyle('Prefix Reset', `> Reset prefix to default system prefix.\n\n• **Prefix:** \`${config.prefix}\``, config.colors.default).toPayload());
        }
        const current = guild.prefix || config.prefix;
        return interaction.reply(embedStyle('Server Prefix', `> Current server prefix configuration.\n\n• **Prefix:** \`${current}\`\n• **Set:** \`${current}prefix set <new>\`\n• **Reset:** \`${current}prefix reset\``).toPayload());
    });
}
