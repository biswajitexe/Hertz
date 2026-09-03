import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import ms from "ms";
import { giveawayHandler, GiveawayData } from "../../structures/GiveawayHandler";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage server giveaways')
    .addSubcommand(subcommand =>
        subcommand
            .setName('start')
            .setDescription('Start a new giveaway')
            .addStringOption(option =>
                option.setName('time')
                    .setDescription('Duration of the giveaway (e.g., 10m, 1h, 1d)')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option.setName('winners')
                    .setDescription('Number of winners')
                    .setRequired(true)
                    .setMinValue(1)
            )
            .addStringOption(option =>
                option.setName('prize')
                    .setDescription('The prize for the giveaway')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('end')
            .setDescription('End an active giveaway immediately')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The message ID of the giveaway')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('reroll')
            .setDescription('Reroll a winner for a giveaway')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The message ID of the giveaway')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('pause')
            .setDescription('Pause an active giveaway')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The message ID of the giveaway')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('resume')
            .setDescription('Resume a paused giveaway')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The message ID of the giveaway')
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all active giveaways')
    );

const embedStyle = (interaction: ChatInputCommandInteraction, title: string, description: string, color: number = config.colors.primary) => {
    return new V2Embed()
        .setColor(color)
        .setTitle(`${config.emojis.giveaways || "🎉"} ${title}`)
        .setDescription(description)
        .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
        .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
};

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    const subcommand = interaction.options.getSubcommand(false);

    // Public Command: List or Help (No Subcommand)
    if (subcommand === 'list' || !subcommand) {
        if (subcommand === 'list') {
            await handleList(interaction);
        } else {
            // Default / Help
            const embed = new V2Embed()
                .setColor(config.colors.primary)
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setTitle(`${config.emojis.giveaways || "🎉"} Giveaway Commands`)
                .setDescription(
                    "`gstart` , `gend` , `gpause`\n" +
                    "`gresume` , `greroll` , `glist`"
                )
                .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());

            await interaction.reply(embed.toPayload());
        }
        return;
    }

    // Permission Check for Management Commands
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) && interaction.user.id !== process.env.OWNER_ID) {
        const embed = new V2Embed()
            .setColor(config.colors.error)
            .setDescription(`${config.emojis.error} You do not have permission to manage giveaways. (Requires \`Manage Messages\`)`)
            .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
        return interaction.reply(embed.toPayload({ ephemeral: true }));
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
        const embed = new V2Embed()
            .setColor(config.colors.error)
            .setDescription(`${config.emojis.error} Please provide a valid duration (minimum 10s). Example: \`1h\`, \`1d\`.`)
            .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
        return interaction.reply(embed.toPayload({ ephemeral: true }));
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
        ...embed.toPayload({ extraComponents: [button] }),
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
        return interaction.reply(createErrorV2('Giveaway not found. Check the Message ID.').toPayload({ ephemeral: true }));
    }
    if (giveaway.ended) {
        return interaction.reply(createErrorV2('This giveaway has already ended.').toPayload({ ephemeral: true }));
    }

    await giveawayHandler.endGiveaway(giveaway.id);
    const embed = embedStyle(interaction, 'Giveaway Ended', `${config.emojis.success} Successfully ended the giveaway for **${giveaway.prize}**.`);
    return interaction.reply(embed.toPayload({ ephemeral: true }));
}

export async function handleReroll(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message_id', true);
    const giveaway = giveawayHandler.getGiveawayByMessage(interaction.guildId!, messageId);

    if (!giveaway) {
        return interaction.reply(createErrorV2('Giveaway not found.').toPayload({ ephemeral: true }));
    }
    if (!giveaway.ended) {
        return interaction.reply(createErrorV2('This giveaway has not ended yet.').toPayload({ ephemeral: true }));
    }

    await giveawayHandler.rerollGiveaway(giveaway.id, interaction.channel as any);
    const embed = embedStyle(interaction, 'Giveaway Rerolled', `${config.emojis.success} Successfully rerolled winners for **${giveaway.prize}**.`);
    return interaction.reply(embed.toPayload({ ephemeral: true }));
}

export async function handlePause(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message_id', true);
    const giveaway = giveawayHandler.getGiveawayByMessage(interaction.guildId!, messageId);
    if (!giveaway) {
        return interaction.reply(createErrorV2('Giveaway not found.').toPayload({ ephemeral: true }));
    }

    const success = await giveawayHandler.pauseGiveaway(giveaway.id);
    if (success) {
        const embed = embedStyle(interaction, 'Giveaway Paused', `${config.emojis.success} Successfully paused the giveaway for **${giveaway.prize}**.`);
        return interaction.reply(embed.toPayload({ ephemeral: true }));
    } else {
        return interaction.reply(createErrorV2('Could not pause (already paused or ended).').toPayload({ ephemeral: true }));
    }
}

export async function handleResume(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message_id', true);
    const giveaway = giveawayHandler.getGiveawayByMessage(interaction.guildId!, messageId);
    if (!giveaway) {
        return interaction.reply(createErrorV2('Giveaway not found.').toPayload({ ephemeral: true }));
    }

    const success = await giveawayHandler.resumeGiveaway(giveaway.id);
    if (success) {
        const embed = embedStyle(interaction, 'Giveaway Resumed', `${config.emojis.success} Successfully resumed the giveaway for **${giveaway.prize}**.`);
        return interaction.reply(embed.toPayload({ ephemeral: true }));
    } else {
        return interaction.reply(createErrorV2('Could not resume (not paused or ended).').toPayload({ ephemeral: true }));
    }
}

export async function handleList(interaction: ChatInputCommandInteraction) {
    const giveaways = giveawayHandler.getAllGiveaways(interaction.guildId!);
    if (giveaways.length === 0) {
        const embed = new V2Embed()
            .setColor(config.colors.warning)
            .setDescription(`${config.emojis.warning} No active giveaways found for this server.`)
            .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());
        return interaction.reply(embed.toPayload({ ephemeral: true }));
    }

    const list = giveaways.slice(0, 10).map(g => {
        return `**${config.emojis.dot} Prize:** ${g.prize}\n**ID:** \`${g.messageId}\` • **Status:** ${g.ended ? 'Ended' : g.paused ? 'Paused' : 'Running'}\n**Ends:** <t:${Math.floor(g.endTime / 1000)}:R>`;
    }).join('\n\n');

    const embed = embedStyle(interaction, 'Active Giveaways', list);
    return interaction.reply(embed.toPayload());
}
