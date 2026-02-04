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
exports.command = new discord_js_1.SlashCommandBuilder()
    .setName('roleall')
    .setDescription('Manage roles for all members')
    .addSubcommand(subcommand => subcommand
    .setName('add')
    .setDescription('Add a role to all members')
    .addRoleOption(option => option.setName('role').setDescription('The role').setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('remove')
    .setDescription('Remove a role from all members')
    .addRoleOption(option => option.setName('role').setDescription('The role').setRequired(true)));
function run(interaction, database) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!interaction.guild)
            return;
        if (!((_a = interaction.memberPermissions) === null || _a === void 0 ? void 0 : _a.has(discord_js_1.PermissionFlagsBits.Administrator)) && interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: `${config.emojis.error} You do not have permission to manage roles (Admin only).`, ephemeral: true });
        }
        const subcommand = interaction.options.getSubcommand(false);
        const role = interaction.options.getRole('role');
        if (!subcommand || !role) {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setDescription(`\`?roleall add <role>\`\n\`?roleall remove <role>\``)
                .setFooter({ text: `Xeon • Advanced Moderation`, iconURL: interaction.client.user.displayAvatarURL() });
            return interaction.reply({ embeds: [embed] });
        }
        const botMember = yield interaction.guild.members.fetchMe();
        if (role.position >= botMember.roles.highest.position) {
            return interaction.reply({ content: `${config.emojis.error} I cannot manage this role (it is higher or equal to my highest role).`, ephemeral: true });
        }
        if (role.managed) {
            return interaction.reply({ content: `${config.emojis.error} I cannot manage this role (it is managed by an integration).`, ephemeral: true });
        }
        yield interaction.deferReply();
        const members = yield interaction.guild.members.fetch();
        const allMembers = Array.from(members.values());
        const validMembers = allMembers.filter(m => !m.user.bot);
        let count = 0;
        let failed = 0;
        const batchSize = 10;
        function processBatch(batch, action) {
            return __awaiter(this, void 0, void 0, function* () {
                const promises = batch.map((member) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        if (action === 'add') {
                            if (!member.roles.cache.has(role.id)) {
                                yield member.roles.add(role.id);
                                return true;
                            }
                        }
                        else {
                            if (member.roles.cache.has(role.id)) {
                                yield member.roles.remove(role.id);
                                return true;
                            }
                        }
                        return false;
                    }
                    catch (e) {
                        return 'error';
                    }
                }));
                const results = yield Promise.all(promises);
                results.forEach(res => {
                    if (res === true)
                        count++;
                    if (res === 'error')
                        failed++;
                });
            });
        }
        if (subcommand === 'add') {
            yield interaction.editReply({ content: `${config.emojis.loading || "🔄"} Processing **${validMembers.length}** members... This may take a while.` });
            for (let i = 0; i < validMembers.length; i += batchSize) {
                const batch = validMembers.slice(i, i + batchSize);
                yield processBatch(batch, 'add');
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(`${config.emojis.success} **Added role ${role.name} to ${count} members.** (Failed: ${failed})`);
            yield interaction.editReply({ content: '', embeds: [embed] });
        }
        else if (subcommand === 'remove') {
            yield interaction.editReply({ content: `${config.emojis.loading || "🔄"} Processing **${validMembers.length}** members... This may take a while.` });
            for (let i = 0; i < validMembers.length; i += batchSize) {
                const batch = validMembers.slice(i, i + batchSize);
                yield processBatch(batch, 'remove');
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xED4245)
                .setDescription(`${config.emojis.success} **Removed role ${role.name} from ${count} members.** (Failed: ${failed})`);
            yield interaction.editReply({ content: '', embeds: [embed] });
        }
    });
}
