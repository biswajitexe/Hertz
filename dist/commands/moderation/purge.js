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
    .setName('purge')
    .setDescription('Delete multiple messages at once')
    .addIntegerOption(option => option.setName('amount')
    .setDescription('Number of messages to delete (default 10, max 100)')
    .setMinValue(1)
    .setMaxValue(100)
    .setRequired(false))
    .addUserOption(option => option.setName('user')
    .setDescription('Delete messages from a specific user')
    .setRequired(false))
    .addBooleanOption(option => option.setName('bots')
    .setDescription('Delete messages from all bots')
    .setRequired(false));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild || !interaction.channel)
            return;
        let amount = interaction.options.getInteger('amount') || 10;
        const targetUser = interaction.options.getUser('user');
        const botsOnly = interaction.options.getBoolean('bots');
        const channel = interaction.channel;
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.ManageMessages)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply((0, componentV2_1.createErrorV2)("You do not have permission to purge messages.").toPayload({ ephemeral: true }));
        }
        if (!channel.bulkDelete) {
            return interaction.reply((0, componentV2_1.createErrorV2)("This channel cannot be purged.").toPayload({ ephemeral: true }));
        }
        yield interaction.deferReply({ ephemeral: false });
        try {
            const fetchAmount = (targetUser || botsOnly) ? 100 : amount;
            const messages = yield channel.messages.fetch({ limit: fetchAmount });
            let messagesToDelete = messages;
            if (targetUser) {
                messagesToDelete = messagesToDelete.filter((m) => m.author.id === targetUser.id);
            }
            else if (botsOnly) {
                messagesToDelete = messagesToDelete.filter((m) => m.author.bot);
            }
            const rawAmount = interaction.options.getInteger('amount');
            if (targetUser || botsOnly) {
                if (rawAmount) {
                    messagesToDelete = messagesToDelete.first(rawAmount);
                }
            }
            else {
                messagesToDelete = messages.first(amount);
            }
            const finalDeleteList = messagesToDelete instanceof Map || messagesToDelete instanceof Array ? messagesToDelete : messagesToDelete;
            const deleteCount = Array.isArray(finalDeleteList) ? finalDeleteList.length : finalDeleteList.size;
            if (deleteCount === 0) {
                return interaction.editReply((0, componentV2_1.createErrorV2)("No matching messages found to delete.").toPayload());
            }
            yield channel.bulkDelete(finalDeleteList, true);
            const embed = new componentV2_1.V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.clear} Messages Purged`)
                .setDescription(`> Successfully deleted **${deleteCount}** messages.`);
            if (targetUser)
                embed.setDescription(`> Deleted **${deleteCount}** messages from **${targetUser.tag}**.`);
            if (botsOnly)
                embed.setDescription(`> Deleted **${deleteCount}** bot messages.`);
            yield interaction.editReply(embed.toPayload());
            setTimeout(() => interaction.deleteReply().catch(() => { }), 30000);
        }
        catch (err) {
            console.error(err);
            if (interaction.deferred) {
                return interaction.editReply((0, componentV2_1.createErrorV2)("Failed to delete messages. Messages older than 14 days cannot be bulk deleted.").toPayload());
            }
            else {
                return interaction.reply((0, componentV2_1.createErrorV2)("Failed to delete messages.").toPayload({ ephemeral: true }));
            }
        }
    });
}
