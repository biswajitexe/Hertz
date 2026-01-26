import { ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonInteraction, StringSelectMenuInteraction, ButtonStyle } from "discord.js";
import { Database } from "../../database";
import { SlashCommandBuilder } from "@discordjs/builders";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help about the bot commands')
    .addStringOption(option => option.setName('command').setDescription('The command you want to get help for').setRequired(false));

export const aliases = ['h', 'commands'];

const activeHelpMessages = new Map();

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    console.log("[HelpCommand] Run started");
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
        return interaction.reply({
            content: "This help session has expired. Please use `/help` command again.",
            ephemeral: true,
        });
    }

    const messageId = interaction.message.id;
    const helpData = activeHelpMessages.get(messageId);

    // Strict user check logic
    if (helpData && helpData.userId !== interaction.user.id) {
        return interaction.reply({
            content: "You can only interact with your own help menu. Use `/help` to get your own menu.",
            ephemeral: true,
        });
    }

    try {
        await interaction.deferUpdate();

        if (helpData) {
            setupTimeout(interaction.message as any, interaction.user.id);
        }

        if (interaction.isStringSelectMenu() && interaction.customId === "help_category") {
            const selectedValue = interaction.values[0];
            const moduleKey = selectedValue.replace("help_", "");
            console.log(`[HelpDebug] Selecting module: ${moduleKey}`);
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

    const totalCommands = Object.values(config.modules).reduce((acc: any, mod: any) => acc + (mod.commands.length || 0), 0);

    // Personalized Title
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setAuthor({ name: `Hi, ${user.username}!`, iconURL: user.displayAvatarURL() })
        .setThumbnail(client.user?.displayAvatarURL())
        .setDescription(`> **Xeon is a powerful, advanced server automation tool.**\n> **Prefix:** \`${config.prefix}\``)
        .addFields(
            {
                name: "Modules",
                value: ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "social", "extra"]
                    .map(key => `> [${config.modules[key]?.name || key}](https://discord.gg/xeon)`)
                    .join("\n"),
                inline: false
            },
            {
                name: "Links",
                value: `> [Support Server](https://discord.gg/suttabar) • [Invite Me](https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands) • [Vote](https://top.gg/bot/${client.user?.id})`,
                inline: false
            }
        )
        .setFooter({ text: `Developed by Vasudev AI Team`, iconURL: client.user?.displayAvatarURL() })
        .setTimestamp();

    // Redesigned Buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setEmoji(config.emojis.home).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("help_delete").setEmoji(config.emojis.delete).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("help_all_commands").setLabel("All Commands").setEmoji(config.emojis.commands).setStyle(ButtonStyle.Primary)
    );

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(createModuleSelectMenu("Select a Category"));

    let sentMessage;
    if (isUpdate) {
        sentMessage = await context.editReply({ embeds: [embed], components: [selectMenu, buttons] });
    } else {
        sentMessage = await context.reply({ embeds: [embed], components: [selectMenu, buttons], fetchReply: true });
    }

    if (sentMessage) setupTimeout(sentMessage, context.user.id);
}

async function sendModuleHelp(interaction: any, moduleKey: string) {
    const module = config.modules[moduleKey];
    if (!module) return;

    const commandsText = module.commands.map(cmd => `\`${cmd.name}\``).join(", ");

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(module.name)
        .setDescription(`> ${commandsText.substring(0, 4096)}`)
        .setFooter({ text: `Xeon • ${module.name}`, iconURL: interaction.client.user?.displayAvatarURL() });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setEmoji(config.emojis.home).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("help_delete").setEmoji(config.emojis.delete).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("help_all_commands").setLabel("All Commands").setEmoji(config.emojis.commands).setStyle(ButtonStyle.Primary)
    );

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(createModuleSelectMenu("Choose another Category"));

    await interaction.editReply({ embeds: [embed], components: [selectMenu, buttons] });
}

async function sendAllCommands(interaction: any) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setDescription(`Full list of available commands.`)
        .setFooter({ text: `Xeon • Total Commands: ${Object.values(config.modules).reduce((acc: any, mod: any) => acc + (mod.commands.length || 0), 0)}`, iconURL: interaction.client.user?.displayAvatarURL() })
        .setTimestamp();

    const moduleOrder = ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"];
    moduleOrder.forEach(key => {
        const module = config.modules[key];
        if (module) {
            const cmds = module.commands.map(c => `\`${c.name}\``).join(", ");
            embed.addFields({
                name: `${module.name}`,
                value: `> ${cmds}`,
                inline: false
            });
        }
    });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("help_home").setEmoji(config.emojis.home).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("help_delete").setEmoji(config.emojis.delete).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("help_all_commands").setLabel("All Commands").setEmoji(config.emojis.commands).setStyle(ButtonStyle.Primary).setDisabled(true), // Disabled on View All
    );

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(createModuleSelectMenu("Choose a specific Category"));

    await interaction.editReply({ embeds: [embed], components: [selectMenu, buttons] });
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
        return interaction.reply({ content: `Command \`${commandName}\` not found.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`Command: /${foundCmd.name}`)
        .addFields(
            { name: "Description", value: foundCmd.description },
            { name: "Module", value: foundModule?.name || "Unknown" }
        );

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

function createModuleSelectMenu(placeholder: string) {
    const moduleOrder = ["antinuke", "automod", "moderation", "media", "giveaways", "welcomer", "extra"];
    return new StringSelectMenuBuilder()
        .setCustomId("help_category")
        .setPlaceholder(placeholder)
        .addOptions(moduleOrder.map(key => ({
            label: config.modules[key].name,
            emoji: config.emojis[key],
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
