"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = log;
const colors_1 = __importDefault(require("colors"));
function log(text) {
    let puts = text.replace("g\{([^}]+)\}", colors_1.default.green("$1"))
        .replace(/r\{([^}]+)\}/, colors_1.default.red("$1"))
        .replace(/b\{([^}]+)\}/, colors_1.default.blue("$1"))
        .replace(/p\{([^}]+)\}/, colors_1.default.magenta("$1"));
    console.log(puts);
}
