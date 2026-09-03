import { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonInteraction, StringSelectMenuInteraction, ButtonStyle } from "discord.js";
import { Database } from "../../database";
import { SlashCommandBuilder } from "@discordjs/builders";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help about the bot commands')
    .addStringOption(option => option.setName('command').setDescription('The command you want to get help for').setRequired(false));

export const aliases = ['h', 'commands'];

const activeHelpMessages = new Map();

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const commandName = interaction.options.getString('command');
    if (commandName) {
        await sendCommandHelp(interaction, commandName);
    } else {
        await sendHelpMenu(interaction);
    }
}

export async function handleInteraction(interaction: ButtonInteraction | StringSelectMenuInteraction, database: Database) {
    if (!interaction.customId.startsWith('help_')) return;

    if (interaction.customId.includes("_disabled")) {
        return interaction.reply(createErrorV2("This help session has expired. Please use `/help` command again.").toPayload({ ephemeral: true }));
    }

    const messageId = interaction.message.id;
    const helpData = activeHelpMessages.get(messageId);

    // Strict user check logic
    if (helpData && helpData.userId !== interaction.user.id) {
        return interaction.reply(createErrorV2("You can only interact with your own help menu. Use `/help` to get your own menu.").toPayload({ ephemeral: true }));
    }

    try {
        await interaction.deferUpdate();

        if (helpData) {
            setupTimeout(interaction.message as any, interaction.user.id);
        }

        if (interaction.isStringSelectMenu() && interaction.customId === "help_category") {
            const selectedValue = interaction.values[0];
            const moduleKey = selectedValue.replace("help_", "");
            await sendModuleHelp(interaction, moduleKey);
        } else if (interaction.isButton()) {
            if (interaction.customId === "help_home") {
                await sendHelpMenu(interaction, true);
            } else if (interaction.customId === "help_delete") {
                if (activeHelpMessages.has(messageId)) {
                    clearTimeout(activeHelpMessages.get(messageId).timeout);
                    activeHelpMessages.delete(messageId);
                }
                await interaction.deleteReply().catch(() => { });
            } else if (interaction.customId === "help_all_commands") {
                await sendAllCommands(interaction);
            }
        }
    } catch (error) {
        console.error("Error handling help interaction:", error);
    }
}

async function sendHelpMenu(context: any, isUpdate = false) {
    const client = context.client;
    const user = context.user || context.author;

    // Personalized Title
    const card = new V2Embed()
        .setColor(config.colors.primary)
        .setAuthor(`Command Center • ${user.username}`, user.displayAvatarURL())
        .setThumbnail(client.user?.displayAvatarURL())
        .setTitle(`Hertz Command Center`)
        .setDescription(`> **Advanced Server Automation & Security System**\n> **Prefix:** \`${config.prefix}\` • **Slash Commands:** Enabled`)
        .addFields(
            {
                name: "Modules",
                value: ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"]
                    .map(key => `> **${config.modules[key]?.name || key}** — ${config.modules[key]?.description || ""}`)
                    .join("\n"),
                inline: false
            },
            {
                name: "Quick Links",
                value: `> [Support Server](https://discord.gg/suttabar) • [Invite Me](https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands) • [Vote](https://top.gg/bot/${client.user?.id})`,
                inline: false
            }
        )
        .setFooter(`Developed by Vasudev AI Team`, client.user?.displayAvatarURL())
        .setTimestamp();

    // Redesigned Buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("help_all_commands").setLabel("All Commands").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(ButtonStyle.Danger)
    );

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(createModuleSelectMenu("Select a Category"));

    let sentMessage;
    if (isUpdate) {
        sentMessage = await context.editReply(card.toPayload({ extraComponents: [selectMenu, buttons] }));
    } else {
        sentMessage = await context.reply({ ...card.toPayload({ extraComponents: [selectMenu, buttons] }), fetchReply: true });
    }

    if (sentMessage) setupTimeout(sentMessage, context.user.id);
}

async function sendModuleHelp(interaction: any, moduleKey: string) {
    const module = config.modules[moduleKey];
    if (!module) return;

    const commandsText = module.commands.map(cmd => `\`${cmd.name}\``).join(", ");

    const card = new V2Embed()
        .setColor(config.colors.primary)
        .setAuthor(`Module Help`, interaction.client.user?.displayAvatarURL())
        .setTitle(`${module.name} Module`)
        .setDescription(`> ${commandsText.substring(0, 4096)}`)
        .setFooter(`Hertz • ${module.name}`, interaction.client.user?.displayAvatarURL());

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("help_all_commands").setLabel("All Commands").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(ButtonStyle.Danger)
    );

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(createModuleSelectMenu("Choose another Category"));

    await interaction.editReply(card.toPayload({ extraComponents: [selectMenu, buttons] }));
}

async function sendAllCommands(interaction: any) {
    const totalCount = Object.values(config.modules).reduce((acc: any, mod: any) => acc + (mod.commands.length || 0), 0);
    const card = new V2Embed()
        .setColor(config.colors.primary)
        .setTitle(`All Commands (${totalCount})`)
        .setDescription(`Full list of available commands across all categories:`)
        .setFooter(`Hertz • Total Commands: ${totalCount}`, interaction.client.user?.displayAvatarURL())
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

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setLabel("Home").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("help_delete").setLabel("Close").setStyle(ButtonStyle.Danger)
    );

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(createModuleSelectMenu("Select a Category"));

    await interaction.editReply(card.toPayload({ extraComponents: [selectMenu, buttons] }));
}

async function sendCommandHelp(interaction: any, commandName: string) {
    let foundCmd, foundModule;
    for (const [key, mod] of Object.entries(config.modules)) {
        foundCmd = mod.commands.find(c => c.name === commandName);
        if (foundCmd) {
            foundModule = mod;
            break;
        }
    }

    if (!foundCmd) {
        return interaction.reply(createErrorV2(`Command \`${commandName}\` not found.`).toPayload({ ephemeral: true }));
    }

    const card = new V2Embed()
        .setColor(config.colors.primary)
        .setTitle(`Command: /${foundCmd.name}`)
        .addFields(
            { name: "Description", value: foundCmd.description },
            { name: "Module", value: foundModule?.name || "Unknown" }
        );

    await interaction.reply(card.toPayload({ ephemeral: true }));
}

function createModuleSelectMenu(placeholder: string) {
    const moduleOrder = ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"];
    return new StringSelectMenuBuilder()
        .setCustomId("help_category")
        .setPlaceholder(placeholder)
        .addOptions(moduleOrder.map(key => ({
            label: config.modules[key].name,
            value: `help_${key}`,
            description: config.modules[key].description.substring(0, 100)
        })));
}

function setupTimeout(message: any, userId: string) {
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
