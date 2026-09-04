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
exports.command = void 0;
exports.run = run;
const discord_js_1 = require("discord.js");
const config = __importStar(require("../../config"));
const util_1 = require("util");
const componentV2_1 = require("../../utilities/componentV2");
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('eval')
    .setDescription('Evaluates arbitrary JavaScript code (Owner Only)')
    .addStringOption(option => option.setName('code').setDescription('The code to evaluate').setRequired(true));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        const botConfig = yield database.getBotConfig();
        const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.ownerUsers)
            owners.push(...botConfig.ownerUsers);
        if (botConfig === null || botConfig === void 0 ? void 0 : botConfig.developerUsers)
            owners.push(...botConfig.developerUsers);
        if (!owners.includes(interaction.user.id)) {
            return interaction.reply((0, componentV2_1.createErrorV2)('Unknown command.').toPayload({ ephemeral: true }));
        }
        const code = interaction.options.getString('code', true);
        const embedStyle = (title, description, color, fields) => {
            const embed = new componentV2_1.V2Embed()
                .setColor(color)
                .setTitle(`${config.emojis.dev} ${title}`)
                .setDescription(description || "")
                .addFields(...fields)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            return embed;
        };
        try {
            let evaled = eval(code);
            if (evaled instanceof Promise)
                evaled = yield evaled;
            let output = (0, util_1.inspect)(evaled, { depth: 0 });
            if (output.length > 2000)
                output = output.slice(0, 1990) + "...";
            const embed = embedStyle('Evaluation Successful', null, config.colors.default, [
                { name: 'Input', value: `> \`\`\`js\n${code}\n\`\`\`` },
                { name: 'Output', value: `> \`\`\`js\n${output}\n\`\`\`` }
            ]);
            yield interaction.reply(embed.toPayload({ ephemeral: true }));
        }
        catch (error) {
            const embed = embedStyle('Evaluation Failed', null, config.colors.error, [
                { name: 'Input', value: `> \`\`\`js\n${code}\n\`\`\`` },
                { name: 'Error', value: `> \`\`\`js\n${error.message}\n\`\`\`` }
            ]);
            yield interaction.reply(embed.toPayload({ ephemeral: true }));
        }
    });
}
