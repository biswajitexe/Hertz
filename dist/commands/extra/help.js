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
exports.aliases = exports.command = void 0;
exports.run = run;
exports.handleInteraction = handleInteraction;
const discord_js_1 = require("discord.js");
const builders_1 = require("@discordjs/builders");
const config = __importStar(require("../../config"));
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new builders_1.SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help about the bot commands')
    .addStringOption(option => option.setName('command').setDescription('The command you want to get help for').setRequired(false));
exports.aliases = ['h', 'commands'];
const activeHelpMessages = new Map();
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const commandName = interaction.options.getString('command');
        if (commandName) {
            yield sendCommandHelp(interaction, commandName);
        }
        else {
            yield sendHelpMenu(interaction);
        }
    });
}
function handleInteraction(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.customId.startsWith('help_'))
            return;
        if (interaction.customId.includes("_disabled")) {
            return interaction.reply((0, componentV2_1.createErrorV2)("This help session has expired. Please use `/help` command again.").toPayload({ ephemeral: true }));
        }
        const messageId = interaction.message.id;
        const helpData = activeHelpMessages.get(messageId);
        if (helpData && helpData.userId !== interaction.user.id) {
            return interaction.reply((0, componentV2_1.createErrorV2)("You can only interact with your own help menu. Use `/help` to get your own menu.").toPayload({ ephemeral: true }));
        }
        try {
            yield interaction.deferUpdate();
            if (helpData) {
                setupTimeout(interaction.message, interaction.user.id);
            }
            if (interaction.isStringSelectMenu() && interaction.customId === "help_category") {
                const selectedValue = interaction.values[0];
                const moduleKey = selectedValue.replace("help_", "");
                yield sendModuleHelp(interaction, moduleKey);
            }
            else if (interaction.isButton()) {
                if (interaction.customId === "help_home") {
                    yield sendHelpMenu(interaction, true);
                }
                else if (interaction.customId === "help_delete") {
                    if (activeHelpMessages.has(messageId)) {
                        clearTimeout(activeHelpMessages.get(messageId).timeout);
                        activeHelpMessages.delete(messageId);
                    }
                    yield interaction.deleteReply().catch(() => { });
                }
                else if (interaction.customId === "help_all_commands") {
                    yield sendAllCommands(interaction);
                }
            }
        }
        catch (error) {
            console.error("Error handling help interaction:", error);
        }
    });
}
function sendHelpMenu(context_1) {
    return __awaiter(this, arguments, void 0, function* (context, isUpdate = false) {
        var _a, _b, _c, _d;
        const client = context.client;
        const user = context.user || context.author;
        const card = new componentV2_1.V2Embed()
            .setColor(config.colors.primary)
            .setAuthor(`Command Center • ${user.username}`, user.displayAvatarURL())
            .setThumbnail((_a = client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL())
            .setTitle(`Hertz Command Center`)
            .setDescription(`> **Advanced Server Automation & Security System**\n> **Prefix:** \`${config.prefix}\` • **Slash Commands:** Enabled`)
            .addFields({
            name: "Modules",
            value: ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"]
                .map(key => { var _a, _b; return `> **${((_a = config.modules[key]) === null || _a === void 0 ? void 0 : _a.name) || key}** — ${((_b = config.modules[key]) === null || _b === void 0 ? void 0 : _b.description) || ""}`; })
                .join("\n"),
            inline: false
        }, {
            name: "Quick Links",
            value: `> [Support Server](https://discord.gg/suttabar) • [Invite Me](https://discord.com/api/oauth2/authorize?client_id=${(_b = client.user) === null || _b === void 0 ? void 0 : _b.id}&permissions=8&scope=bot%20applications.commands) • [Vote](https://top.gg/bot/${(_c = client.user) === null || _c === void 0 ? void 0 : _c.id})`,
            inline: false
        })
            .setFooter(`Developed by Vasudev AI Team`, (_d = client.user) === null || _d === void 0 ? void 0 : _d.displayAvatarURL())
            .setTimestamp();
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("help_all_commands").setLabel("All Commands").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(discord_js_1.ButtonStyle.Danger));
        const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(createModuleSelectMenu("Select a Category"));
        let sentMessage;
        if (isUpdate) {
            sentMessage = yield context.editReply(card.toPayload({ extraComponents: [selectMenu, buttons] }));
        }
        else {
            sentMessage = yield context.reply(Object.assign(Object.assign({}, card.toPayload({ extraComponents: [selectMenu, buttons] })), { fetchReply: true }));
        }
        if (sentMessage)
            setupTimeout(sentMessage, context.user.id);
    });
}
function sendModuleHelp(interaction, moduleKey) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const module = config.modules[moduleKey];
        if (!module)
            return;
        const commandsText = module.commands.map(cmd => `\`${cmd.name}\``).join(", ");
        const card = new componentV2_1.V2Embed()
            .setColor(config.colors.primary)
            .setAuthor(`Module Help`, (_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL())
            .setTitle(`${module.name} Module`)
            .setDescription(`> ${commandsText.substring(0, 4096)}`)
            .setFooter(`Hertz • ${module.name}`, (_b = interaction.client.user) === null || _b === void 0 ? void 0 : _b.displayAvatarURL());
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("help_all_commands").setLabel("All Commands").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(discord_js_1.ButtonStyle.Danger));
        const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(createModuleSelectMenu("Choose another Category"));
        yield interaction.editReply(card.toPayload({ extraComponents: [selectMenu, buttons] }));
    });
}
function sendAllCommands(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const totalCount = Object.values(config.modules).reduce((acc, mod) => acc + (mod.commands.length || 0), 0);
        const card = new componentV2_1.V2Embed()
            .setColor(config.colors.primary)
            .setTitle(`All Commands (${totalCount})`)
            .setDescription(`Full list of available commands across all categories:`)
            .setFooter(`Hertz • Total Commands: ${totalCount}`, (_a = interaction.client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL())
            .setTimestamp();
        const moduleOrder = ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"];
        moduleOrder.forEach(key => {
            const mod = config.modules[key];
            if (mod && mod.commands.length > 0) {
                const list = mod.commands.map(c => `\`${c.name}\``).join(", ");
                card.addFields({
                    name: `${mod.name} (${mod.commands.length})`,
                    value: `> ${list.substring(0, 1024)}`,
                    inline: false
                });
            }
        });
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(discord_js_1.ButtonStyle.Danger));
        const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(createModuleSelectMenu("Select a Category"));
        yield interaction.editReply(card.toPayload({ extraComponents: [selectMenu, buttons] }));
    });
}
function sendCommandHelp(interaction, commandName) {
    return __awaiter(this, void 0, void 0, function* () {
        let foundCmd, foundModule;
        for (const [key, mod] of Object.entries(config.modules)) {
            foundCmd = mod.commands.find(c => c.name === commandName);
            if (foundCmd) {
                foundModule = mod;
                break;
            }
        }
        if (!foundCmd) {
            return interaction.reply((0, componentV2_1.createErrorV2)(`Command \`${commandName}\` not found.`).toPayload({ ephemeral: true }));
        }
        const card = new componentV2_1.V2Embed()
            .setColor(config.colors.primary)
            .setTitle(`Command: /${foundCmd.name}`)
            .addFields({ name: "Description", value: foundCmd.description }, { name: "Module", value: (foundModule === null || foundModule === void 0 ? void 0 : foundModule.name) || "Unknown" });
        yield interaction.reply(card.toPayload({ ephemeral: true }));
    });
}
function createModuleSelectMenu(placeholder) {
    const moduleOrder = ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"];
    return new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("help_category")
        .setPlaceholder(placeholder)
        .addOptions(moduleOrder.map(key => ({
        label: config.modules[key].name,
        value: `help_${key}`,
        description: config.modules[key].description.substring(0, 100)
    })));
}
function setupTimeout(message, userId) {
    const messageId = message.id;
    if (activeHelpMessages.has(messageId)) {
        clearTimeout(activeHelpMessages.get(messageId).timeout);
    }
    const timeout = setTimeout(() => {
        message.edit({ components: [] }).catch(() => { });
        activeHelpMessages.delete(messageId);
    }, 60000);
    activeHelpMessages.set(messageId, { timeout, userId });
}
