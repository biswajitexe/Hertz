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
const database_1 = require("./src/database");
require("dotenv/config");
const fs = __importStar(require("fs"));
function checkBadges() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = new database_1.Database();
            yield new Promise(r => setTimeout(r, 2000));
            const config = yield db.getBotConfig();
            let output = "--- Current Badge Holders ---\n";
            output += "\n[Owner]\n";
            output += (process.env.OWNER_ID || "Not Set in .env") + "\n";
            output += "\n[Premium Users]\n";
            if (config.premiumUsers && config.premiumUsers.length > 0) {
                output += config.premiumUsers.join(", ") + "\n";
            }
            else {
                output += "None\n";
            }
            output += "\n[Staff Users]\n";
            if (config.staffUsers && config.staffUsers.length > 0) {
                output += config.staffUsers.join(", ") + "\n";
            }
            else {
                output += "None\n";
            }
            output += "\n[No Prefix Users]\n";
            if (config.noPrefixUsers && config.noPrefixUsers.length > 0) {
                output += config.noPrefixUsers.join(", ") + "\n";
            }
            else {
                output += "None\n";
            }
            fs.writeFileSync('badges_output.txt', output);
            console.log("Output written to badges_output.txt");
            process.exit(0);
        }
        catch (e) {
            fs.writeFileSync('badges_output.txt', "Error: " + e);
            process.exit(1);
        }
    });
}
checkBadges();
