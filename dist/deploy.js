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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@discordjs/rest");
const v10_1 = require("discord-api-types/v10");
const dotenv = __importStar(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
console.log("Current working directory:", process.cwd());
const envPath = path_1.default.join(process.cwd(), '.env');
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath, debug: true });
const logging_1 = require("./logging");
const token = (_a = process.env.DISCORD_TOKEN) === null || _a === void 0 ? void 0 : _a.trim();
const clientId = process.env.CLIENT_ID;
const rest = new rest_1.REST({ version: '10' }).setToken(token);
let commands = [];
(0, logging_1.log)('Started refreshing application p{[/]} commands.');
function deploy(dir) {
    const commandFiles = fs_1.default.readdirSync(dir).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const data = require(path_1.default.join(dir, file));
        commands.push(data.command.toJSON());
    }
    const commandFolders = fs_1.default.readdirSync(dir)
        .filter(file => fs_1.default.lstatSync(path_1.default.join(dir, file)).isDirectory());
    for (const commandFolder of commandFolders) {
        deploy(path_1.default.join(dir, commandFolder));
    }
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!token) {
            throw new Error("DISCORD_TOKEN is missing in environment variables.");
        }
        if (!clientId) {
            throw new Error("CLIENT_ID is missing in environment variables.");
        }
        deploy(path_1.default.join(__dirname, 'commands'));
        yield rest.put(v10_1.Routes.applicationCommands(clientId), { body: commands });
        (0, logging_1.log)('Successfully reloaded application p{[/]} commands.');
    }
    catch (error) {
        console.error(error);
    }
}))();
