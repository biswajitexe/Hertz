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
        const client = context.client;
        const user = context.user || context.author;
        const moduleList = ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"]
            .map(key => { var _a, _b; return `> ${config.emojis[key] || "•"} **${((_a = config.modules[key]) === null || _a === void 0 ? void 0 : _a.name) || key}** — ${((_b = config.modules[key]) === null || _b === void 0 ? void 0 : _b.description) || ""}`; })
            .join("\n");
        const card = new componentV2_1.V2Embed()
            .setColor(config.colors.default)
            .setTitle(`Hey, I'm Hertz`)
            .setDescription(`> Modular, high-performance Discord management system.\n\n` +
            `• **Prefix:** \`${config.prefix}\` | **Slash:** \`/\`\n` +
            `• **Help:** \`${config.prefix}help\`\n\n` +
            `**Modules:**\n` +
            moduleList)
            .setFooter(`Requested by ${user.username}! | Powered by Hertz`, user.displayAvatarURL());
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
            setupTimeout(sentMessage, user.id);
    });
}
function sendModuleHelp(interaction, moduleKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const module = config.modules[moduleKey];
        if (!module)
            return;
        const moduleEmoji = config.emojis[moduleKey] || config.emojis.module;
        const commandsList = module.commands.map(cmd => `• \`${config.prefix}${cmd.name}\` — ${cmd.description}`).join("\n");
        const card = new componentV2_1.V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${moduleEmoji} ${module.name} Module`)
            .setDescription(`> ${module.description}\n\n` +
            `**Commands:**\n` +
            commandsList)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`, interaction.user.displayAvatarURL());
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("help_all_commands").setLabel("All Commands").setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(discord_js_1.ButtonStyle.Danger));
        const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(createModuleSelectMenu("Choose another Category"));
        yield interaction.editReply(card.toPayload({ extraComponents: [selectMenu, buttons] }));
    });
}
function sendAllCommands(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const card = new componentV2_1.V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.info} All Commands`)
            .setDescription(`> Use \`${config.prefix}help <command>\` for detailed usage information.`)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`, interaction.user.displayAvatarURL());
        const fields = Object.entries(config.modules).map(([key, mod]) => ({
            name: `${config.emojis[key] || "•"} ${mod.name}`,
            value: `> ${mod.commands.map(c => `\`${c.name}\``).join(", ")}`,
            inline: false
        }));
        card.addFields(...fields);
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(discord_js_1.ButtonStyle.Danger));
        const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(createModuleSelectMenu("Choose a Category"));
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
            return interaction.reply((0, componentV2_1.createErrorV2)(`Command \`${commandName}\` not found.`, undefined, interaction.user).toPayload({ ephemeral: true }));
        }
        const card = new componentV2_1.V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.slash} Command: /${foundCmd.name}`)
            .setDescription(`> ${foundCmd.description}`)
            .addFields({ name: "Usage", value: `\`${config.prefix}${foundCmd.usage || foundCmd.name}\``, inline: true }, { name: "Module", value: (foundModule === null || foundModule === void 0 ? void 0 : foundModule.name) || "Unknown", inline: true })
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`, interaction.user.displayAvatarURL());
        yield interaction.reply(card.toPayload({ ephemeral: true }));
    });
}
function createModuleSelectMenu(placeholder) {
    const moduleOrder = ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"];
    return new discord_js_1.StringSelectMenuBuilder()
        .setCustomId("help_category")
        .setPlaceholder(placeholder)
        .addOptions(moduleOrder.map(key => {
        const rawEmoji = config.emojis[key];
        const parsed = rawEmoji ? (0, discord_js_1.parseEmoji)(rawEmoji) : null;
        const option = {
            label: config.modules[key].name,
            value: `help_${key}`,
            description: config.modules[key].description.substring(0, 100)
        };
        if (parsed && parsed.id) {
            option.emoji = { id: parsed.id, name: parsed.name };
        }
        return option;
    }));
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
