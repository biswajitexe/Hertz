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
    .setName('rep')
    .setDescription('Give reputation to a user.')
    .addUserOption(option => option.setName('user').setDescription('The user to give rep to').setRequired(true));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const target = interaction.options.getUser('user', true);
        if (target.id === interaction.user.id) {
            return interaction.reply({ content: `${config.emojis.error} You cannot give reputation to yourself!`, ephemeral: true });
        }
        if (target.bot) {
            return interaction.reply({ content: `${config.emojis.error} You cannot give reputation to a bot!`, ephemeral: true });
        }
        const senderProfile = yield database.getUser(interaction.user.id);
        const now = Date.now();
        const COOLDOWN = 24 * 60 * 60 * 1000;
        if (senderProfile.lastRepDate && (now - senderProfile.lastRepDate) < COOLDOWN) {
            const remaining = COOLDOWN - (now - senderProfile.lastRepDate);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            return interaction.reply({ content: `${config.emojis.error} You can give reputation again in **${hours}h ${minutes}m**.`, ephemeral: true });
        }
        const targetProfile = yield database.getUser(target.id);
        targetProfile.reps += 1;
        yield database.updateUser(targetProfile);
        senderProfile.lastRepDate = now;
        yield database.updateUser(senderProfile);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`${config.emojis.success} You gave **+1 Reputation** to ${target}!`)
            .setFooter({ text: `Current Reps: ${targetProfile.reps}` });
        return interaction.reply({ embeds: [embed] });
    });
}
