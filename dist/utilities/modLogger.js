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
exports.logAction = logAction;
const discord_js_1 = require("discord.js");
function logAction(guild, target, moderator, action, reason, database, extraInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const guildData = yield database.retrieveGuild(guild.id);
        if (!guildData || !guildData.antinuke.enabled || !guildData.antinuke.logChannelId)
            return;
        const channel = guild.channels.cache.get(guildData.antinuke.logChannelId);
        if (!channel || !channel.isTextBased())
            return;
        let color = '#ff0000';
        switch (action) {
            case 'BAN':
                color = '#ff0000';
                break;
            case 'UNBAN':
                color = '#00ff00';
                break;
            case 'KICK':
                color = '#ff9900';
                break;
            case 'TIMEOUT':
                color = '#ffff00';
                break;
            case 'WARN':
                color = '#ffff00';
                break;
            case 'MUTE':
                color = '#ffff00';
                break;
            case 'UNMUTE':
                color = '#00ff00';
                break;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setAuthor({ name: `${action} | ${target.tag}`, iconURL: target.displayAvatarURL() })
            .setColor(color)
            .addFields({ name: 'User', value: `${target} (${target.id})`, inline: true }, { name: 'Moderator', value: `${moderator} (${moderator.id})`, inline: true }, { name: 'Reason', value: reason })
            .setTimestamp();
        if (extraInfo) {
            embed.addFields({ name: 'Additional Info', value: extraInfo });
        }
        yield channel.send({ embeds: [embed] }).catch(() => { });
    });
}
