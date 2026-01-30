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
const database_1 = require("./src/database");
require("dotenv/config");
function checkBadges() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Connecting to database...");
        const db = new database_1.Database();
        yield new Promise(r => setTimeout(r, 2000));
        const config = yield db.getBotConfig();
        console.log("\n--- Current Badge Holders ---");
        console.log("\n[Owner]");
        console.log(process.env.OWNER_ID || "Not Set in .env");
        console.log("\n[Premium Users]");
        if (config.premiumUsers && config.premiumUsers.length > 0) {
            console.log(config.premiumUsers.join(", "));
        }
        else {
            console.log("None");
        }
        console.log("\n[Staff Users]");
        if (config.staffUsers && config.staffUsers.length > 0) {
            console.log(config.staffUsers.join(", "));
        }
        else {
            console.log("None");
        }
        console.log("\n[No Prefix Users]");
        if (config.noPrefixUsers && config.noPrefixUsers.length > 0) {
            console.log(config.noPrefixUsers.join(", "));
        }
        else {
            console.log("None");
        }
        process.exit(0);
    });
}
checkBadges();
