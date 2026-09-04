import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createSuccessV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('antispam')
    .setDescription('Configure the anti-spam system.')
    .addSubcommand(subcommand => subcommand
        .setName('enable')
        .setDescription('Enable the anti-spam filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('disable')
        .setDescription('Disable the anti-spam filter.')
    )
    .addSubcommand(subcommand => subcommand
        .setName('status')
        .setDescription('Check the current status of the anti-spam filter.')
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
        await interaction.reply(createErrorV2('Only the Server Owner, Trustable Admins, or Bot Owner can manage anti-spam settings.').toPayload({ ephemeral: true }));
        return;
    }

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply();

    try {
        if (sub === 'enable') {
            if (guildData.messageFilters.spam) {
                await interaction.editReply(createErrorV2('Anti-Spam is already enabled!').toPayload());
                return;
            }
            guildData.messageFilters.spam = true;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Spam filter has been Enabled.').toPayload());
        } else if (sub === 'disable') {
            if (!guildData.messageFilters.spam) {
                await interaction.editReply(createErrorV2('Anti-Spam is already disabled!').toPayload());
                return;
            }
            guildData.messageFilters.spam = false;
            await database.insertGuild(interaction.guild.id, guildData);
            await interaction.editReply(createSuccessV2('Anti-Spam filter has been DISABLED.').toPayload());
        } else if (sub === 'status') {
            const statusEmoji = guildData.messageFilters.spam ? config.emojis.switch_on : config.emojis.switch_off;
            const statusText = guildData.messageFilters.spam ? "Enabled" : "Disabled";

            let description = `**Anti-Spam System ${statusText}.**\n\n**Active Protections:**\n> ${statusEmoji} Anti-Spam`;

            if (!guildData.messageFilters.spam) {
                description += `\n\n**System is currently disabled.**\nUse \`${config.prefix}antispam enable\` to activate security and protect your server! ${config.emojis.lock}`;
            }

            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setTitle(`${config.emojis.automod} Anti-Spam Panel`)
                .setDescription(description)
                .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
                .setFooter(`Requested by ${interaction.user.username} | Powered by Hertz`, interaction.user.displayAvatarURL());

            await interaction.editReply(embed.toPayload());
        } else {
            // Subcommand not found (likely prefix command empty call)
            const embed = new V2Embed()
                .setColor(config.colors.primary)
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL())
                .setTitle('Anti-Spam Commands')
                .setDescription(
                    '`?antispam enable`\n' +
                    '`?antispam disable`\n' +
                    '`?antispam status`'
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
