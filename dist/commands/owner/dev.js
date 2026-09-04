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
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
exports.run = run;
exports.handleInteraction = handleInteraction;
const discord_js_1 = require("discord.js");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const config = __importStar(require("../../config"));
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('dev')
    .setDescription('Owner Only Control Panel');
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const botConfig = yield database.getBotConfig();
        const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.ownerUsers)
            owners.push(...botConfig.ownerUsers);
        if (!owners.includes(interaction.user.id)) {
            if (!interaction.isRepliable())
                return;
            return interaction.reply((0, componentV2_1.createErrorV2)("Unknown command.").toPayload({ ephemeral: true }));
        }
        yield sendOwnerPanel(interaction);
    });
}
function handleInteraction(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (!interaction.customId.startsWith('dev_'))
            return;
        const botConfig = yield database.getBotConfig();
        const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.ownerUsers)
            owners.push(...botConfig.ownerUsers);
        if (!owners.includes(interaction.user.id)) {
            return interaction.reply((0, componentV2_1.createErrorV2)("You cannot use this menu.").toPayload({ ephemeral: true }));
        }
        if (interaction.isButton() && interaction.customId === 'dev_home') {
            yield sendOwnerPanel(interaction, true);
        }
        else if (interaction.isStringSelectMenu() && interaction.customId === 'dev_select') {
            const commandName = interaction.values[0];
            try {
                const ownerDir = node_path_1.default.join(__dirname);
                const files = node_fs_1.default.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));
                let foundCmd = null;
                for (const file of files) {
                    try {
                        const cmd = require(node_path_1.default.join(ownerDir, file));
                        if (((_a = cmd.command) === null || _a === void 0 ? void 0 : _a.name) === commandName) {
                            foundCmd = cmd;
                            break;
                        }
                    }
                    catch (_c) { }
                }
                if (!foundCmd) {
                    return interaction.reply((0, componentV2_1.createErrorV2)(`Command information not found for \`${commandName}\`.`).toPayload({ ephemeral: true }));
                }
                let description = `> ${foundCmd.command.description || "No description provided."}`;
                const rawData = typeof foundCmd.command.toJSON === 'function' ? foundCmd.command.toJSON() : foundCmd.command;
                if ((_b = rawData.options) === null || _b === void 0 ? void 0 : _b.some((opt) => opt.type === discord_js_1.ApplicationCommandOptionType.Subcommand || opt.type === discord_js_1.ApplicationCommandOptionType.SubcommandGroup)) {
                    const subcommands = rawData.options
                        .filter((opt) => opt.type === discord_js_1.ApplicationCommandOptionType.Subcommand || opt.type === discord_js_1.ApplicationCommandOptionType.SubcommandGroup)
                        .map((opt) => `\`${opt.name}\``)
                        .join(", ");
                    if (subcommands) {
                        description = `> ${subcommands}`;
                    }
                }
                else {
                    description = `> \`${foundCmd.command.name}\``;
                }
                const embed = new componentV2_1.V2Embed()
                    .setColor(config.colors.default)
                    .setTitle(`${foundCmd.command.name.charAt(0).toUpperCase() + foundCmd.command.name.slice(1)}`)
                    .setDescription(description)
                    .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
                const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("dev_home").setLabel("Home").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(discord_js_1.ButtonStyle.Danger));
                const selectMenu = yield createOwnerSelectMenu();
                yield interaction.update(embed.toPayload({ extraComponents: [selectMenu, buttons] }));
            }
            catch (error) {
                console.error(error);
                yield interaction.reply((0, componentV2_1.createErrorV2)("Error retrieving command details.").toPayload({ ephemeral: true }));
            }
        }
    });
}
function sendOwnerPanel(interaction_1) {
    return __awaiter(this, arguments, void 0, function* (interaction, isUpdate = false) {
        const ownerDir = node_path_1.default.join(__dirname);
        const files = node_fs_1.default.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && file !== 'dev.ts' && file !== 'dev.js');
        const cleanCommands = files.map(file => {
            var _a;
            try {
                const cmd = require(node_path_1.default.join(ownerDir, file));
                if ((_a = cmd.command) === null || _a === void 0 ? void 0 : _a.name) {
                    return `\`${config.prefix}${cmd.command.name}\``;
                }
                return null;
            }
            catch (e) {
                console.error(`[DevCmd] Failed to load ${file}:`, e);
                return null;
            }
        }).filter(c => c !== null).join(", ");
        const embed = new componentV2_1.V2Embed()
            .setColor(config.colors.default)
            .setTitle('Owner Commands')
            .setDescription(`> ${cleanCommands}`)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
        const selectMenu = yield createOwnerSelectMenu();
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(discord_js_1.ButtonStyle.Secondary).setDisabled(true), new discord_js_1.ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(discord_js_1.ButtonStyle.Danger));
        if (isUpdate && (interaction.isButton() || interaction.isStringSelectMenu())) {
            yield interaction.update(embed.toPayload({ extraComponents: [selectMenu, buttons] }));
        }
        else if (interaction.isChatInputCommand()) {
            yield interaction.reply(embed.toPayload({ extraComponents: [selectMenu, buttons], ephemeral: true }));
        }
    });
}
function createOwnerSelectMenu() {
    return __awaiter(this, void 0, void 0, function* () {
        const ownerDir = node_path_1.default.join(__dirname);
        const files = node_fs_1.default.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));
        const selectOptions = files.map(file => {
            var _a;
            try {
                const cmd = require(node_path_1.default.join(ownerDir, file));
                if ((_a = cmd.command) === null || _a === void 0 ? void 0 : _a.name) {
                    return {
                        label: cmd.command.name,
                        value: cmd.command.name
                    };
                }
                return null;
            }
            catch (_b) {
                return null;
            }
        }).filter((opt) => opt !== null);
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("dev_select")
            .setPlaceholder("Select a Command")
            .addOptions(selectOptions));
    });
}
