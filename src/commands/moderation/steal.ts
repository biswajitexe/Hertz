import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { createErrorEmbed } from "../../utilities/embedUtils";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('steal')
    .setDescription('Steal emoji(s) from another server (args or reply).')
    .addStringOption(option =>
        option.setName('emoji')
            .setDescription('The emoji(s) to steal (custom emoji or URL).')
            .setRequired(false)
    )
    .addStringOption(option =>
        option.setName('name')
            .setDescription('Name for the new emoji (ignored if multiple emojis).')
            .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageEmojisAndStickers) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorEmbed(interaction.user, "**You do not have permission to manage emojis.**").toPayload({ ephemeral: true }));
    }

    let rawInput = interaction.options.getString('emoji', false);
    let name = interaction.options.getString('name', false);

    if (!rawInput) {
        const msg = (interaction as any).message;
        if (msg && msg.reference && msg.reference.messageId) {
            try {
                const referencedMsg = await msg.channel.messages.fetch(msg.reference.messageId);
                if (referencedMsg && referencedMsg.content) {
                    rawInput = referencedMsg.content;
                }
            } catch (e) { }
        }
    }

    const emojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/g;

    if (!rawInput) {
        if (name && emojiRegex.test(name)) {
            rawInput = name;
            name = null;
        } else {
            const embed = new V2Embed()
                .setColor(config.colors.default)
                .setTitle(`Steal Emojis`)
                .setDescription(`> Steal emojis from other servers or messages.\n\n• **Usage:** \`${config.prefix}steal <emoji(s)>\`\n• **Rename:** \`${config.prefix}steal <emoji> <name>\`\n• **Reply:** Reply to any message with \`${config.prefix}steal\``)
                .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

            return interaction.reply(embed.toPayload());
        }
    }

    const matches: any[] = Array.from(rawInput.matchAll(emojiRegex));

    if (matches.length === 0 && name) {
        const nameMatches = Array.from(name.matchAll(emojiRegex));
        if (nameMatches.length > 0) {
            rawInput = name;
            name = null;
            matches.push(...nameMatches);
        }
    }

    const idRegex = /(\d{17,19})/g;
    if (matches.length === 0) {
        const idMatches = Array.from(rawInput.matchAll(idRegex));
        if (idMatches.length > 0) {
            for (const m of idMatches) {
                const id = m[1];
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
                    `<:${extractedName}:${id}>`,
                    animated ? 'a' : undefined,
                    extractedName,
                    id
                ] as unknown as RegExpMatchArray);
            }
        }
    }

    if (matches.length === 0) {
        if (rawInput.startsWith('http')) {
            await handleSingleInternal(interaction, rawInput, name || "stolen_emoji");
            return;
        }
        return interaction.reply(createErrorEmbed(interaction.user, "**No emojis found.**").toPayload({ ephemeral: true }));
    }

    if (matches.length > 20) {
        return interaction.reply(createErrorEmbed(interaction.user, "**Too many emojis! Maximum 20 at a time.**").toPayload({ ephemeral: true }));
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

        const targetName = (matches.length === 1 && name) ? name : extractedName;

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
        return interaction.editReply(createErrorEmbed(interaction.user, `**Failed to add emojis.**\nLikely reasons: File size, Slots full, or invalid format.`).toPayload());
    }

    const joinLimit = (arr: string[], limit: number = 5) => {
        if (arr.length <= limit) return arr.join(', ');
        return `${arr.slice(0, limit).join(', ')} (+${arr.length - limit} more)`;
    };

    let description = "";
    if (added.length > 0) description += `${config.emojis.success} **Added:** ${joinLimit(added)}\n`;
    if (existing.length > 0) description += `${config.emojis.warning} **Skipped (Exist):** ${joinLimit(existing)}\n`;
    if (failed.length > 0) description += `${config.emojis.error} **Failed:** ${joinLimit(failed)}`;

    if (!description) description = "No emojis added (Duplicates skipped).";

    const embed = new V2Embed()
        .setColor(config.colors.default)
        .setTitle('Emoji Stealer')
        .setDescription(description)
        .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

    await interaction.editReply(embed.toPayload());
}

async function handleSingleInternal(interaction: ChatInputCommandInteraction, url: string, name: string) {
    try {
        await interaction.deferReply();
        const emoji = await interaction.guild!.emojis.create({ attachment: url, name: name });

        const embed = new V2Embed()
            .setColor(config.colors.default)
            .setTitle(`${config.emojis.correct} Emoji Added`)
            .setDescription(`> Successfully added emoji to server.\n\n• **Emoji:** ${emoji}\n• **Name:** \`${name}\``)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);

        await interaction.editReply(embed.toPayload());

    } catch (err: any) {
        let errorMsg = "Failed to add emoji.";
        if (err.code === 30008) errorMsg = "Maximum number of emojis reached.";
        if (err.code === 50035) errorMsg = "Invalid form body.";
        await interaction.editReply(createErrorEmbed(interaction.user, `**${errorMsg}**`).toPayload());
    }
}
