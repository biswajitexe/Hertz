import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages at once')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('Number of messages to delete (default 10, max 100)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
    )
    .addUserOption(option =>
        option.setName('user')
            .setDescription('Delete messages from a specific user')
            .setRequired(false)
    )
    .addBooleanOption(option =>
        option.setName('bots')
            .setDescription('Delete messages from all bots')
            .setRequired(false)
    );

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild || !interaction.channel) return;

    let amount = interaction.options.getInteger('amount') || 10;
    const targetUser = interaction.options.getUser('user');
    const botsOnly = interaction.options.getBoolean('bots');
    const channel = interaction.channel as TextChannel;

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2("You do not have permission to purge messages.").toPayload({ ephemeral: true }));
    }

    if (!channel.bulkDelete) {
        return interaction.reply(createErrorV2("This channel cannot be purged.").toPayload({ ephemeral: true }));
    }

    await interaction.deferReply({ ephemeral: false });

    try {
        const fetchAmount = (targetUser || botsOnly) ? 100 : amount;
        const messages = await channel.messages.fetch({ limit: fetchAmount });
        let messagesToDelete: any = messages;

        if (targetUser) {
            messagesToDelete = messagesToDelete.filter((m: any) => m.author.id === targetUser.id);
        } else if (botsOnly) {
            messagesToDelete = messagesToDelete.filter((m: any) => m.author.bot);
        }

        const rawAmount = interaction.options.getInteger('amount');
        if (targetUser || botsOnly) {
            if (rawAmount) {
                messagesToDelete = messagesToDelete.first(rawAmount) as any;
            }
        } else {
            messagesToDelete = messages.first(amount) as any;
        }

        const finalDeleteList = messagesToDelete instanceof Map || messagesToDelete instanceof Array ? messagesToDelete : messagesToDelete;
        const deleteCount = Array.isArray(finalDeleteList) ? finalDeleteList.length : (finalDeleteList as any).size;

        if (deleteCount === 0) {
            return interaction.editReply(createErrorV2("No matching messages found to delete.").toPayload());
        }

        await channel.bulkDelete(finalDeleteList, true);

        const embed = new V2Embed()
            .setColor(0x57F287)
            .setTitle(`${config.emojis.success || "✅"} Messages Purged`)
            .setDescription(`Successfully deleted **${deleteCount}** messages.`);

        if (targetUser) embed.setDescription(`Deleted **${deleteCount}** messages from **${targetUser.tag}**.`);
        if (botsOnly) embed.setDescription(`Deleted **${deleteCount}** bot messages.`);

        await interaction.editReply(embed.toPayload());
        setTimeout(() => interaction.deleteReply().catch(() => { }), 30000);

    } catch (err) {
        console.error(err);
        if (interaction.deferred) {
            return interaction.editReply(createErrorV2("Failed to delete messages. Messages older than 14 days cannot be bulk deleted.").toPayload());
        } else {
            return interaction.reply(createErrorV2("Failed to delete messages.").toPayload({ ephemeral: true }));
        }
    }
}
