"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBadMessage = isBadMessage;
exports.replaceValues = replaceValues;
const unzalgo_1 = __importDefault(require("unzalgo"));
function getValues(context) {
    var _a;
    return {
        user: context.author.tag,
        userID: context.author.id,
        serverName: (_a = context.guild) === null || _a === void 0 ? void 0 : _a.name,
    };
}
function isBadMessage(message, blacklist) {
    message = (0, unzalgo_1.default)(message.toLowerCase(), { detectionThreshold: 0 });
    const strippedMessage = message.replace(/(.)\1{1,}/gm, "$1");
    for (const blacklistedWord of blacklist) {
        if (strippedMessage.includes(blacklistedWord)
            || message.includes(blacklistedWord))
            return true;
    }
    return false;
}
function replaceValues(message, context) {
    let values = getValues(context);
    for (const [k, v] of Object.entries(values)) {
        message = message.replace(`{${k}}`, v);
    }
    return message;
}
