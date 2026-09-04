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
    .setName('antieveryone')
    .setDescription('Configure the anti-everyone/here system.')
    .addSubcommand(subcommand => subcommand
    .setName('enable')
    .setDescription('Enable the anti-everyone filter.'))
    .addSubcommand(subcommand => subcommand
    .setName('disable')
    .setDescription('Disable the anti-everyone filter.'))
    .addSubcommand(subcommand => subcommand
    .setName('status')
    .setDescription('Check the current status of the anti-everyone filter.'));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.inCachedGuild())
            return;
        let guildData = yield database.retrieveGuild(interaction.guild.id);
        if (!guildData) {
            yield database.defaultGuild(interaction.guild);
            guildData = yield database.retrieveGuild(interaction.guild.id);
        }
        if (!guildData)
            return;
        if (!guildData.extraOwners)
            guildData.extraOwners = [];
        if (!guildData.extraAdmins)
            guildData.extraAdmins = [];
        const isOwner = interaction.user.id === interaction.guild.ownerId;
        const isExtraOwner = guildData.extraOwners.includes(interaction.user.id);
        const isExtraAdmin = guildData.extraAdmins.includes(interaction.user.id);
        const isBotOwner = interaction.user.id === process.env.OWNER_ID;
        if (!isOwner && !isExtraOwner && !isExtraAdmin && !isBotOwner) {
            yield interaction.reply((0, componentV2_1.createErrorV2)('Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-everyone settings.').toPayload({ ephemeral: true }));
            return;
        }
        const sub = interaction.options.getSubcommand();
        yield interaction.deferReply();
        try {
            if (sub === 'enable') {
                if (guildData.messageFilters.antiEveryone) {
                    yield interaction.editReply((0, componentV2_1.createErrorV2)('Anti-Everyone is already enabled!').toPayload());
                    return;
                }
                guildData.messageFilters.antiEveryone = true;
                yield database.insertGuild(interaction.guild.id, guildData);
                yield interaction.editReply((0, componentV2_1.createSuccessV2)('Anti-Everyone filter has been Enabled.').toPayload());
            }
            else if (sub === 'disable') {
                if (!guildData.messageFilters.antiEveryone) {
                    yield interaction.editReply((0, componentV2_1.createErrorV2)('Anti-Everyone is already disabled!').toPayload());
                    return;
                }
                guildData.messageFilters.antiEveryone = false;
                yield database.insertGuild(interaction.guild.id, guildData);
                yield interaction.editReply((0, componentV2_1.createSuccessV2)('Anti-Everyone filter has been DISABLED.').toPayload());
            }
            else if (sub === 'status') {
                const statusEmoji = guildData.messageFilters.antiEveryone ? config.emojis.switch_on : config.emojis.switch_off;
                const statusText = guildData.messageFilters.antiEveryone ? "Enabled" : "Disabled";
                let description = `> Modular, high-performance automated moderation filter.\n\n` +
                    `• **Status:** ${statusText}\n` +
                    `• **Filter:** ${statusEmoji} Anti-Everyone / Anti-Here`;
                if (!guildData.messageFilters.antiEveryone) {
                    description += `\n\n> ${config.emojis.lock} Use \`${config.prefix}antieveryone enable\` to activate protection.`;
                }
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.default)
                    .setTitle(`${config.emojis.automod} Anti-Everyone Panel`)
                    .setDescription(description)
                    .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
                yield interaction.editReply(embed.toPayload());
            }
            else {
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.default)
                    .setTitle(`${config.emojis.automod} Anti-Everyone Commands`)
                    .setDescription(`> \`${config.prefix}antieveryone enable\`\n` +
                    `> \`${config.prefix}antieveryone disable\`\n` +
                    `> \`${config.prefix}antieveryone status\``)
                    .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
                yield interaction.editReply(embed.toPayload());
            }
        }
        catch (error) {
            console.error(error);
            yield interaction.editReply((0, componentV2_1.createErrorV2)('Failed to update settings.').toPayload());
        }
    });
}
