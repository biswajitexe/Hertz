"use strict";
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
const giveaway_1 = require("./giveaway");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('gpause')
    .setDescription('Pause a giveaway (Shortcut)')
    .addStringOption(option => option.setName('message_id')
    .setDescription('The message ID')
    .setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages);
function run(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, giveaway_1.handlePause)(interaction);
    });
}
