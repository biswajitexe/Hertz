
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { createSuccessEmbed, createErrorEmbed } from "../../utilities/embedUtils";

export const command = new SlashCommandBuilder()
    .setName('steal')
    .setDescription('Steal emoji(s) from another server (args or reply).')
    .addStringOption(option =>
        option.setName('emoji')
            .setDescription('The emoji(s) to steal (custom emoji or URL).')
            .setRequired(false) // Changed to false to support reply-only usage
    )
    .addStringOption(option =>
        option.setName('name')
            .setDescription('Name for the new emoji (ignored if multiple emojis).')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    // 0. Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageEmojisAndStickers) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**You do not have permission to manage emojis.**")], ephemeral: true });
    }

    let rawInput = interaction.options.getString('emoji', false);
    let name = interaction.options.getString('name', false);

    // 1. Reply Logic: If no input, check reply
    if (!rawInput) {
        const msg = (interaction as any).message; // Shimmed message
        if (msg && msg.reference && msg.reference.messageId) {
            try {
                const referencedMsg = await msg.channel.messages.fetch(msg.reference.messageId);
                if (referencedMsg && referencedMsg.content) {
                    rawInput = referencedMsg.content;
                }
            } catch (e) { }
        }
    }

    // 2. Logic: If valid args, but they meant to swap? 
    // E.g. usage: ?steal name :emoji: 
    // If we only have ONE input found, checks apply.
    // If we detect MULTIPLE emojis, we ignore 'name' arg generally or use it for first?
    const emojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/g;

    // If no rawInput from args or reply, fail.
    if (!rawInput) {
        // Fallback checks (Arg swapping for single emoji case if user did ?steal name :emoji: but only one arg was mapped?)
        // If 'name' has emoji, swap.
        if (name && emojiRegex.test(name)) {
            rawInput = name;
            name = null;
        } else {
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setDescription(`\`?steal <emoji(s)>\`\n\`?steal <emoji> <name>\`\nor **Reply** with \`?steal\``)
                .setFooter({ text: `Xeon • Advanced Moderation`, iconURL: interaction.client.user.displayAvatarURL() });

            return interaction.reply({ embeds: [embed] });
        }
    }

    // If we have input, let's scan for ALL emojis.
    // Also, if rawInput was just a name and 'name' arg was emoji?
    // This is complex for bulk. Let's simplify:
    // Concat args if possible? No, we trust parsing.

    const matches: any[] = Array.from(rawInput.matchAll(emojiRegex));

    // If NO matches in rawInput, but maybe 'name' arg has it?
    if (matches.length === 0 && name) {
        const nameMatches = Array.from(name.matchAll(emojiRegex));
        if (nameMatches.length > 0) {
            // Swap happened
            rawInput = name;
            name = null; // Name consumed as emoji source
            // Re-match
            matches.push(...nameMatches);
        }
    }

    // Check for Raw IDs if still no matches
    const idRegex = /(\d{17,19})/g;
    if (matches.length === 0) {
        const idMatches = Array.from(rawInput.matchAll(idRegex));
        if (idMatches.length > 0) {
            // We found IDs!
            for (const m of idMatches) {
                const id = m[1];
                // Try to fetch to get metadata (name, animated)
                let animated = false;
                let extractedName = `emoji_${id}`;

                try {
                    const fetched = interaction.client.emojis.cache.get(id);
                    if (fetched) {
                        animated = fetched.animated || false;
                        extractedName = fetched.name || extractedName;
                    }
                } catch (e) { }

                matches.push([
                    `<:${extractedName}:${id}>`, // Mock full match string
                    animated ? 'a' : undefined,  // Group 1: 'a' or undefined
                    extractedName,               // Group 2: Name
                    id                           // Group 3: ID
                ] as unknown as RegExpMatchArray);
            }
        }
    }

    if (matches.length === 0) {
        // Check for URL
        if (rawInput.startsWith('http')) {
            // Single URL case
            await handleSingleInternal(interaction, rawInput, name || "stolen_emoji");
            return;
        }
        return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**No emojis found.**")] });
    }

    // Processing Limits
    if (matches.length > 20) {
        return interaction.reply({ embeds: [createErrorEmbed(interaction.user, "**Too many emojis! Maximum 20 at a time.**")] });
    }

    await interaction.deferReply();

    const added: string[] = [];
    const failed: string[] = [];
    const existing: string[] = [];

    for (const match of matches) {
        const animated = match[1] === 'a';
        const extractedName = match[2];
        const id = match[3];
        const type = animated ? 'gif' : 'png';
        const url = `https://cdn.discordapp.com/emojis/${id}.${type}`;

        // Naming: Use custom name ONLY if 1 emoji, otherwise auto-name
        const targetName = (matches.length === 1 && name) ? name : extractedName;

        // Check for Existing
        const alreadyExists = interaction.guild!.emojis.cache.find(e => e.name === targetName);
        if (alreadyExists) {
            existing.push(targetName);
            continue;
        }

        try {
            const emoji = await interaction.guild.emojis.create({ attachment: url, name: targetName });
            added.push(emoji.toString());
        } catch (e) {
            failed.push(extractedName);
        }
    }

    if (added.length === 0 && failed.length > 0) {
        return interaction.editReply({ embeds: [createErrorEmbed(interaction.user, `**Failed to add emojis.**\nLikely reasons: File size, Slots full, or invalid format.`)] });
    }

    // Helper to join with limit
    const joinLimit = (arr: string[], limit: number = 5) => {
        if (arr.length <= limit) return arr.join(', ');
        return `${arr.slice(0, limit).join(', ')} (+${arr.length - limit} more)`;
    };

    // Construct Description
    let description = "";
    if (added.length > 0) description += `${config.emojis.success} **Added:** ${joinLimit(added)}\n`;
    if (existing.length > 0) description += `${config.emojis.warning} **Skipped (Exist):** ${joinLimit(existing)}\n`;
    if (failed.length > 0) description += `${config.emojis.error} **Failed:** ${joinLimit(failed)}`;

    if (!description) description = "No emojis added (Duplicates skipped).";

    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setDescription(description);

    await interaction.editReply({ embeds: [embed] });
}

async function handleSingleInternal(interaction: ChatInputCommandInteraction, url: string, name: string) {
    try {
        await interaction.deferReply();
        const emoji = await interaction.guild!.emojis.create({ attachment: url, name: name });

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`${config.emojis.success} **Added:** ${emoji} \`${name}\``);

        await interaction.editReply({ embeds: [embed] });

    } catch (err: any) {
        let errorMsg = "Failed to add emoji.";
        if (err.code === 30008) errorMsg = "Maximum number of emojis reached.";
        if (err.code === 50035) errorMsg = "Invalid form body.";
        await interaction.editReply({ embeds: [createErrorEmbed(interaction.user, `**${errorMsg}**`)] });
    }
}
