import type { ButtonInteraction, ChatInputCommandInteraction, StringSelectMenuInteraction } from "discord.js";
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import fs from 'node:fs';
import path from 'node:path';
import * as config from "../../config";
import type { Database } from "../../database";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('dev')
    .setDescription('Owner Only Control Panel');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);

    if (!owners.includes(interaction.user.id)) {
        if (!interaction.isRepliable()) return;
        return interaction.reply(createErrorV2("Unknown command.").toPayload({ ephemeral: true }));
    }
    await sendOwnerPanel(interaction);
}

export async function handleInteraction(interaction: ButtonInteraction | StringSelectMenuInteraction, database: Database) {
    if (!interaction.customId.startsWith('dev_')) return;

    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);

    if (!owners.includes(interaction.user.id)) {
        return interaction.reply(createErrorV2("You cannot use this menu.").toPayload({ ephemeral: true }));
    }

    if (interaction.isButton() && interaction.customId === 'dev_home') {
        await sendOwnerPanel(interaction, true);
    } 
    else if (interaction.isStringSelectMenu() && interaction.customId === 'dev_select') {
        const commandName = interaction.values[0];
        
        try {
            const ownerDir = path.join(__dirname);
            const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));
            
            let foundCmd: any = null;
            for(const file of files) {
                try {
                    const cmd = require(path.join(ownerDir, file));
                    if(cmd.command?.name === commandName) {
                        foundCmd = cmd;
                        break;
                    }
                } catch {}
            }

            if (!foundCmd) {
                return interaction.reply(createErrorV2(`Command information not found for \`${commandName}\`.`).toPayload({ ephemeral: true }));
            }

            let description = `> ${foundCmd.command.description || "No description provided."}`;
            
            const rawData = typeof foundCmd.command.toJSON === 'function' ? foundCmd.command.toJSON() : foundCmd.command;
            if (rawData.options?.some((opt: any) => opt.type === ApplicationCommandOptionType.Subcommand || opt.type === ApplicationCommandOptionType.SubcommandGroup)) {
                const subcommands = rawData.options
                    .filter((opt: any) => opt.type === ApplicationCommandOptionType.Subcommand || opt.type === ApplicationCommandOptionType.SubcommandGroup)
                    .map((opt: any) => `\`${opt.name}\``)
                    .join(", ");
                
                if (subcommands) {
                    description = `> ${subcommands}`;
                }
            } else {
                 description = `> \`${foundCmd.command.name}\``;
            }

            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${foundCmd.command.name.charAt(0).toUpperCase() + foundCmd.command.name.slice(1)}`)
                .setDescription(description)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

            const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId("dev_home").setLabel("Home").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(ButtonStyle.Danger)
            );

            const selectMenu = await createOwnerSelectMenu();

            await interaction.update(embed.toPayload({ extraComponents: [selectMenu, buttons] }));

        } catch (error) {
            console.error(error);
            await interaction.reply(createErrorV2("Error retrieving command details.").toPayload({ ephemeral: true }));
        }
    }
}

async function sendOwnerPanel(interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction, isUpdate = false) {
    const ownerDir = path.join(__dirname);
    const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && file !== 'dev.ts' && file !== 'dev.js');

    const cleanCommands = files.map(file => {
        try {
            const cmd = require(path.join(ownerDir, file));
            if (cmd.command?.name) {
                return `\`${config.prefix}${cmd.command.name}\``;
            }
            return null;

        } catch (e) {
            console.error(`[DevCmd] Failed to load ${file}:`, e);
            return null;
        }
    }).filter(c => c !== null).join(", ");

    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setTitle('Owner Commands')
        .setDescription(`> ${cleanCommands}`)
        .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

    const selectMenu = await createOwnerSelectMenu();

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(ButtonStyle.Danger)
    );

    if (isUpdate && (interaction.isButton() || interaction.isStringSelectMenu())) {
        await interaction.update(embed.toPayload({ extraComponents: [selectMenu, buttons] }));
    } else if (interaction.isChatInputCommand()) {
        await interaction.reply(embed.toPayload({ extraComponents: [selectMenu, buttons], ephemeral: true }));
    }
}

async function createOwnerSelectMenu() {
    const ownerDir = path.join(__dirname);
    const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));

    const selectOptions = files.map(file => {
        try {
            const cmd = require(path.join(ownerDir, file));
            if (cmd.command?.name) {
                return {
                    label: cmd.command.name,
                    value: cmd.command.name
                };
            }
            return null;
        } catch { return null; }
    }).filter((opt): opt is { label: string; value: string } => opt !== null);

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("dev_select")
            .setPlaceholder("Select a Command")
            .addOptions(selectOptions)
    );
}
