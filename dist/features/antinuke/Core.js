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
exports.AntinukeCore = void 0;
const config = __importStar(require("../../config"));
const componentV2_1 = require("../../utilities/componentV2");
class AntinukeCore {
    constructor(database) {
        this.rateLimits = new Map();
        this.database = database;
    }
    isWhitelisted(guild, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const guildData = yield this.database.retrieveGuild(guild.id);
            if (!guildData)
                return false;
            if (guild.ownerId === userId)
                return true;
            if (userId === guild.client.user.id)
                return true;
            if (guildData.extraOwners && guildData.extraOwners.includes(userId))
                return true;
            if (guildData.extraAdmins && guildData.extraAdmins.includes(userId))
                return true;
            if (!guildData.messageFilters)
                return false;
            const lists = [
                guildData.messageFilters.linksWhitelist,
                guildData.messageFilters.invitesWhitelist,
                guildData.messageFilters.spamWhitelist
            ];
            for (const list of lists) {
                if (list === null || list === void 0 ? void 0 : list.users.includes(userId))
                    return true;
            }
            try {
                const member = yield guild.members.fetch(userId).catch(() => null);
                if (!member)
                    return false;
                for (const list of lists) {
                    if ((list === null || list === void 0 ? void 0 : list.roles) && list.roles.some(roleId => member.roles.cache.has(roleId))) {
                        return true;
                    }
                }
            }
            catch (e) {
            }
            return false;
        });
    }
    reportAction(guild, executorId, actionType) {
        return __awaiter(this, void 0, void 0, function* () {
            const guildData = yield this.database.retrieveGuild(guild.id);
            if (!guildData || !guildData.antinuke || !guildData.antinuke.enabled)
                return false;
            if (yield this.isWhitelisted(guild, executorId))
                return false;
            const key = `${guild.id}_${executorId}_${actionType}`;
            const limit = guildData.antinuke.limits[actionType];
            const timeWindow = 10000;
            let tracker = this.rateLimits.get(key);
            if (!tracker) {
                tracker = {
                    count: 1,
                    lastTime: Date.now(),
                    timer: setTimeout(() => this.rateLimits.delete(key), timeWindow)
                };
                this.rateLimits.set(key, tracker);
            }
            else {
                tracker.count++;
            }
            if (tracker.count >= limit) {
                this.rateLimits.delete(key);
                yield this.punish(guild, executorId, actionType);
                return true;
            }
            return false;
        });
    }
    punish(guild, executorId, actionType) {
        return __awaiter(this, void 0, void 0, function* () {
            const guildData = yield this.database.retrieveGuild(guild.id);
            if (!guildData)
                return;
            const action = guildData.antinuke.actions[actionType] || 'ban';
            try {
                const member = yield guild.members.fetch(executorId).catch(() => null);
                if (!member) {
                    if (action === 'ban') {
                        yield guild.members.ban(executorId, { reason: `[Antinuke] Exceeded limit for ${actionType}` });
                    }
                    return;
                }
                if (!member.bannable && !member.kickable) {
                    this.log(guild, `**FAILED to punish** <@${executorId}> for ${actionType}. My permissions might be lower.`);
                    return;
                }
                if (action === 'ban') {
                    yield member.ban({ reason: `[Antinuke] Rate limit exceeded for ${actionType}` });
                    this.log(guild, `**BANNED** <@${executorId}> for exceeding limit in **${actionType}**.`);
                }
                else if (action === 'kick') {
                    yield member.kick(`[Antinuke] Rate limit exceeded for ${actionType}`);
                    this.log(guild, `**KICKED** <@${executorId}> for exceeding limit in **${actionType}**.`);
                }
                else {
                }
            }
            catch (e) {
                console.error(`Status: Failed to punish ${executorId}`, e);
            }
        });
    }
    log(guild, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const guildData = yield this.database.retrieveGuild(guild.id);
            if (guildData === null || guildData === void 0 ? void 0 : guildData.antinuke.logChannelId) {
                const channel = guild.channels.cache.get(guildData.antinuke.logChannelId);
                if (channel && channel.isTextBased()) {
                    const embed = new componentV2_1.V2Embed()
                        .setColor(config.colors.error)
                        .setTitle(`${config.emojis.error} Antinuke Triggered`)
                        .setDescription(message)
                        .setTimestamp();
                    yield channel.send(embed.toPayload()).catch(() => { });
                }
            }
        });
    }
}
exports.AntinukeCore = AntinukeCore;
