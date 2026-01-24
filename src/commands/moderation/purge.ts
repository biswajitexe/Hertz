
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

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
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to purge messages.`, ephemeral: true });
    }

    if (!channel.bulkDelete) {
        return interaction.reply({ content: `${config.emojis.error} This channel cannot be purged.`, ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: false });

    try {
        // Fetch max 100 to filter from, or just 'amount' if no filters
        const fetchAmount = (targetUser || botsOnly) ? 100 : amount;

        const messages = await channel.messages.fetch({ limit: fetchAmount });
        let messagesToDelete: any = messages;

        // Apply Filters
        if (targetUser) {
            messagesToDelete = messagesToDelete.filter((m: any) => m.author.id === targetUser!.id);
        } else if (botsOnly) {
            messagesToDelete = messagesToDelete.filter((m: any) => m.author.bot);
        }

        // Apply Amount Limit after filter
        // If filtering, we should respect the amount requested as the count of DELETIONS? 
        // Or just delete all found in the fetched block?
        // User request: "uske piche ke sare message" (all messages behind).
        // Safest is to just take the filtered list. If 'amount' was explicitly set along with user, we could limit.
        // But usually ?purge @user implies "purge recent msgs from user".
        // Let's limit strictly if amount was provided manually, otherwise delete up to 100 found.
        // Actually, let's keep it simple: Delete 'amount' items from the filtered list.

        if (targetUser || botsOnly) {
            // If user SPECIFIED amount with filter (e.g. ?purge 50 @user), treat as "scan 100, delete up to 50 of user"
            // If user DID NOT specify amount (default 10 applied), maybe we should just delete ALL found in the last 100?
            // User said: "?purge" -> 10. "?purge @user" -> "sare" (all).
            // So if amount is DEFAULT (10) and Filter is ON, ignore default and max out?
            // Checking if amount was provided is hard since we defaulted it.
            // Let's assume if Filter is used, default behavior is "Delete all found in last 100" (or 100 limit fetch).
            // But if they typed `?purge 5 @user`, they want 5.
            // Interaction options doesn't capture "was provided". 

            // Strategy:
            // 1. Fetch 100.
            // 2. Filter.
            // 3. If explicit amount behavior needed:
            //    We can check `interaction.options.getInteger('amount')` raw value.
            const rawAmount = interaction.options.getInteger('amount');
            if (rawAmount) {
                messagesToDelete = messagesToDelete.first(rawAmount) as any; // Collection to array? No, first returns Collection in v14? Or array? Map/Collection.
                // collection.first(n) returns Array. We need Collection for bulkDelete usually, OR array of Messages/IDs.
                // bulkDelete accepts Collection<Snowflake, Message> | Map<Snowflake, Message> | Snowflake[] | Message[]
                // So .first(n) returning Message[] is fine.
            }
            // If rawAmount is null, we delete ALL matching in the fetch (up to 100).
        } else {
            // No filter: Just first 'amount'.
            messagesToDelete = messages.first(amount) as any;
        }

        // Convert to array if needed or ensure it's iterable
        const finalDeleteList = messagesToDelete instanceof Map || messagesToDelete instanceof Array ? messagesToDelete : messagesToDelete;
        const deleteCount = Array.isArray(finalDeleteList) ? finalDeleteList.length : (finalDeleteList as any).size;


        if (deleteCount === 0) {
            return interaction.editReply({ content: `${config.emojis.error} No matching messages found to delete.` });
        }

        await channel.bulkDelete(finalDeleteList, true);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setDescription(`${config.emojis.success || "correct"} Successfully deleted **${deleteCount}** messages.`);

        if (targetUser) embed.setDescription(`${config.emojis.success || "correct"} Deleted **${deleteCount}** messages from **${targetUser.tag}**.`);
        if (botsOnly) embed.setDescription(`${config.emojis.success || "correct"} Deleted **${deleteCount}** bot messages.`);

        await interaction.editReply({ embeds: [embed] });
        setTimeout(() => interaction.deleteReply().catch(() => { }), 30000);

    } catch (err) {
        console.error(err);
        // If we deferred, update the deferral
        if (interaction.deferred) {
            return interaction.editReply({ content: `${config.emojis.error} Failed to delete messages. Messages older than 14 days cannot be bulk deleted.` });
        } else {
            return interaction.reply({ content: `${config.emojis.error} Failed to delete messages.`, ephemeral: true });
        }
    }
}
