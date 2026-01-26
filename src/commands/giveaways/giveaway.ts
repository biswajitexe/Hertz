
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { giveawayHandler, GiveawayData } from "../../structures/GiveawayHandler";
import ms from "ms";

export const command = new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .addSubcommand(subcommand =>
        subcommand
            .setName('start')
            .setDescription('Start a new giveaway')
            .addStringOption(option =>
                option.setName('time')
                    .setDescription('Duration (e.g. 1m, 1h, 1d)')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('winners')
                    .setDescription('Number of winners')
                    .setMinValue(1)
                    .setMaxValue(20)
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('prize')
                    .setDescription('Prize for the giveaway')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('end')
            .setDescription('End a giveaway early')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The message ID of the giveaway')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('reroll')
            .setDescription('Reroll a giveaway winner')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The message ID of the giveaway')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('pause')
            .setDescription('Pause a giveaway')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The message ID')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('resume')
            .setDescription('Resume a paused giveaway')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The message ID')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all active giveaways')
    );

const embedStyle = (interaction: ChatInputCommandInteraction, title: string, description: string, color: number = config.colors.primary) => {
    return new EmbedBuilder()
        .setColor(color)
        .setDescription(`**${config.emojis.giveaways || "🎉"} ${title}**\n\n${description}`)
        .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
};

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    const subcommand = interaction.options.getSubcommand(false);
    console.log(`[Giveaway] Run called by ${interaction.user.tag}. Subcommand: '${subcommand}'`);

    // Public Command: List or Help (No Subcommand)
    if (subcommand === 'list' || !subcommand) {
        if (subcommand === 'list') {
            await handleList(interaction);
        } else {
            // Default / Help
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setDescription(`**${config.emojis.giveaways || "🎉"} Giveaway Commands**\n\n` +
                    "`gstart` , `gend` , `gpause`\n" +
                    "`gresume` , `greroll` , `glist`"
                )
                .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });
        }
        return;
    }

    // Permission Check for Management Commands
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) && interaction.user.id !== process.env.OWNER_ID) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setDescription(`${config.emojis.error} You do not have permission to manage giveaways. (Requires \`Manage Messages\`)`)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'start') {
        await handleStart(interaction);
    } else if (subcommand === 'end') {
        await handleEnd(interaction);
    } else if (subcommand === 'reroll') {
        await handleReroll(interaction);
    } else if (subcommand === 'pause') {
        await handlePause(interaction);
    } else if (subcommand === 'resume') {
        await handleResume(interaction);
    }
}

export async function handleStart(interaction: ChatInputCommandInteraction) {
    const timeArg = interaction.options.getString('time', true);
    const winners = interaction.options.getInteger('winners', true);
    const prize = interaction.options.getString('prize', true);

    const duration = ms(timeArg);
    if (!duration || duration < 10000) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setDescription(`${config.emojis.error} Please provide a valid duration (minimum 10s). Example: \`1h\`, \`1d\`.`)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const endTime = Date.now() + duration;
    const giveawayData: Omit<GiveawayData, 'id' | 'guildId' | 'channelId' | 'messageId' | 'participants' | 'ended' | 'paused'> = {
        prize,
        winners,
        hostId: interaction.user.id,
        startTime: Date.now(),
        endTime,
    };

    // Create initial embed/button
    // @ts-ignore - Partial giveaway data for preview
    const embed = giveawayHandler.createGiveawayEmbed({ ...giveawayData, participants: [], paused: false });
    const button = giveawayHandler.createGiveawayButton();

    const giveawayMessage = await interaction.reply({
        embeds: [embed],
        components: [button],
        fetchReply: true
    });

    if (giveawayMessage) {
        giveawayHandler.createGiveaway(
            interaction.guildId!,
            interaction.channelId,
            giveawayMessage.id,
            giveawayData
        );
    }
}

export async function handleEnd(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message_id', true);
    const giveaway = giveawayHandler.getGiveawayByMessage(interaction.guildId!, messageId);

    if (!giveaway) {
        const embed = new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Giveaway not found. Check the Message ID.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (giveaway.ended) {
        const embed = new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} This giveaway has already ended.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await giveawayHandler.endGiveaway(giveaway.id);
    const embed = embedStyle(interaction, 'Giveaway Ended', `${config.emojis.success} Successfully ended the giveaway for **${giveaway.prize}**.`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleReroll(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message_id', true);
    const giveaway = giveawayHandler.getGiveawayByMessage(interaction.guildId!, messageId);

    if (!giveaway) {
        const embed = new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Giveaway not found.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (!giveaway.ended) {
        const embed = new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} This giveaway has not ended yet.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await giveawayHandler.rerollGiveaway(giveaway.id, interaction.channel as any);
    const embed = embedStyle(interaction, 'Giveaway Rerolled', `${config.emojis.success} Successfully rerolled winners for **${giveaway.prize}**.`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handlePause(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message_id', true);
    const giveaway = giveawayHandler.getGiveawayByMessage(interaction.guildId!, messageId);
    if (!giveaway) {
        const embed = new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Giveaway not found.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const success = await giveawayHandler.pauseGiveaway(giveaway.id);
    if (success) {
        const embed = embedStyle(interaction, 'Giveaway Paused', `${config.emojis.success} Successfully paused the giveaway for **${giveaway.prize}**.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
        const embed = new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Could not pause (already paused or ended).`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

export async function handleResume(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message_id', true);
    const giveaway = giveawayHandler.getGiveawayByMessage(interaction.guildId!, messageId);
    if (!giveaway) {
        const embed = new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Giveaway not found.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const success = await giveawayHandler.resumeGiveaway(giveaway.id);
    if (success) {
        const embed = embedStyle(interaction, 'Giveaway Resumed', `${config.emojis.success} Successfully resumed the giveaway for **${giveaway.prize}**.`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
        const embed = new EmbedBuilder().setColor(config.colors.error).setDescription(`${config.emojis.error} Could not resume (not paused or ended).`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

export async function handleList(interaction: ChatInputCommandInteraction) {
    const giveaways = giveawayHandler.getAllGiveaways(interaction.guildId!);
    if (giveaways.length === 0) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setDescription(`${config.emojis.warning} No active giveaways found for this server.`)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const list = giveaways.slice(0, 10).map(g => {
        return `**${config.emojis.dot} Prize:** ${g.prize}\n**ID:** \`${g.messageId}\` • **Status:** ${g.ended ? 'Ended' : g.paused ? 'Paused' : 'Running'}\n**Ends:** <t:${Math.floor(g.endTime / 1000)}:R>`;
    }).join('\n\n');

    const embed = embedStyle(interaction, 'Active Giveaways', list);
    return interaction.reply({ embeds: [embed] });
}
