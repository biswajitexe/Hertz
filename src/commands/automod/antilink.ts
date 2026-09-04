import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createSuccessV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('antilink')
    .setDescription('Configure the anti-link system.')
    .addSubcommand(subcommand => subcommand
        .setName('enable')
        .setDescription('Enable the anti-link filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('disable')
        .setDescription('Disable the anti-link filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('status')
        .setDescription('Check the current status of the anti-link filter.')
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
        await interaction.reply(createErrorV2('Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-link settings.').toPayload({ ephemeral: true }));
        return;
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {
        if (sub === 'enable') {
            if (guildData.messageFilters.links) {
                await interaction.editReply(createErrorV2('Anti-Link is already enabled!').toPayload());
                return;
            }
            guildData.messageFilters.links = true;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Link filter has been Enabled.').toPayload());
        } else if (sub === 'disable') {
            if (!guildData.messageFilters.links) {
                await interaction.editReply(createErrorV2('Anti-Link is already disabled!').toPayload());
                return;
            }
            guildData.messageFilters.links = false;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Link filter has been DISABLED.').toPayload());
        } else if (sub === 'status') {
            const statusEmoji = guildData.messageFilters.links ? config.emojis.switch_on : config.emojis.switch_off;
            const statusText = guildData.messageFilters.links ? "Enabled" : "Disabled";

            let description = `**Anti-Link System ${statusText}.**\n\n**Active Protections:**\n> ${statusEmoji} Anti-Links`;

            if (!guildData.messageFilters.links) {
                description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antilink enable\` to activate security and protect your server! ${config.emojis.lock}`;
            }

            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.automod} Anti-Link Panel`)
                .setDescription(description)
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());

            await interaction.editReply(embed.toPayload());
        } else {
            // Subcommand not found (likely prefix command empty call)
            const embed = new V2Embed()
                .setColor(config.colors.primary)
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL())
                .setTitle('Anti-Link Commands')
                .setDescription(
                    '`?antilink enable`\n' +
                    '`?antilink disable`\n' +
                    '`?antilink status`'
                )
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setFooter('Hertz • Automated Security', interaction.client.user?.displayAvatarURL() || undefined);
            await interaction.editReply(embed.toPayload());
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply(createErrorV2('Failed to update settings.').toPayload());
    }
}
