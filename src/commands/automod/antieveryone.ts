import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createSuccessV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('antieveryone')
    .setDescription('Configure the anti-everyone/here system.')
    .addSubcommand(subcommand => subcommand
        .setName('enable')
        .setDescription('Enable the anti-everyone filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('disable')
        .setDescription('Disable the anti-everyone filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('status')
        .setDescription('Check the current status of the anti-everyone filter.')
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    let guildData = await database.retrieveGuild(interaction.guild.id);
    if (!guildData) {
        await database.defaultGuild(interaction.guild);
        guildData = await database.retrieveGuild(interaction.guild.id);
    }
    if (!guildData) return;

    if (!guildData.extraOwners) guildData.extraOwners = [];
    if (!guildData.extraAdmins) guildData.extraAdmins = [];

    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const isExtraOwner = guildData.extraOwners.includes(interaction.user.id);
    const isExtraAdmin = guildData.extraAdmins.includes(interaction.user.id);
    const isBotOwner = interaction.user.id === process.env.OWNER_ID;

    if (!isOwner && !isExtraOwner && !isExtraAdmin && !isBotOwner) {
        await interaction.reply(createErrorV2('Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-everyone settings.').toPayload({ ephemeral: true }));
        return;
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {
        if (sub === 'enable') {
            if (guildData.messageFilters.antiEveryone) {
                await interaction.editReply(createErrorV2('Anti-Everyone is already enabled!').toPayload());
                return;
            }
            guildData.messageFilters.antiEveryone = true;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Everyone filter has been Enabled.').toPayload());
        } else if (sub === 'disable') {
            if (!guildData.messageFilters.antiEveryone) {
                await interaction.editReply(createErrorV2('Anti-Everyone is already disabled!').toPayload());
                return;
            }
            guildData.messageFilters.antiEveryone = false;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Everyone filter has been DISABLED.').toPayload());
        } else if (sub === 'status') {
            const statusEmoji = guildData.messageFilters.antiEveryone ? config.emojis.switch_on : config.emojis.switch_off;
            const statusText = guildData.messageFilters.antiEveryone ? "Enabled" : "Disabled";

            let description = `> Modular, high-performance automated moderation filter.\n\n` +
                `• **Status:** ${statusText}\n` +
                `• **Filter:** ${statusEmoji} Anti-Everyone / Anti-Here`;

            if (!guildData.messageFilters.antiEveryone) {
                description += `\n\n> ${config.emojis.lock} Use \`${config.prefix}antieveryone enable\` to activate protection.`;
            }

            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.automod} Anti-Everyone Panel`)
                .setDescription(description)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

            await interaction.editReply(embed.toPayload());
        } else {
            // Fallback for prefix command help
            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.automod} Anti-Everyone Commands`)
                .setDescription(
                    `> \`${config.prefix}antieveryone enable\`\n` +
                    `> \`${config.prefix}antieveryone disable\`\n` +
                    `> \`${config.prefix}antieveryone status\``
                )
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            await interaction.editReply(embed.toPayload());
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply(createErrorV2('Failed to update settings.').toPayload());
    }
}
