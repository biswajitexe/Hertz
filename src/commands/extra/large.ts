
import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    CommandInteraction,
    Message
} from "discord.js";
import { emojis, colors } from "../../config";

export const command = new SlashCommandBuilder()
    .setName("large")
    .setDescription("Enlarge a custom emoji")
    .addStringOption(option => 
        option.setName("emoji")
            .setDescription("The emoji to enlarge")
            .setRequired(true)
    );

export const run = async (interaction: any, database: any) => {
    let emojiArg = "";

    // 1. Parse Input
    if (interaction instanceof CommandInteraction) {
        emojiArg = interaction.options.get("emoji")?.value as string;
    } else if (interaction instanceof Message) {
        const args = interaction.content.split(" ").slice(1);
        emojiArg = args[0] || ""; // Default to empty string if no arg

        // Check for Reply if no emoji arg provided
        if (!emojiArg && interaction.reference && interaction.reference.messageId) {
            try {
                const replyMessage = await interaction.channel.messages.fetch(interaction.reference.messageId);
                if (replyMessage && replyMessage.content) {
                    // Try to find the FIRST emoji in the reply
                    const customEmojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
                    const match = replyMessage.content.match(customEmojiRegex);
                    if (match) {
                        emojiArg = match[0]; // Use the full emoji string found
                    }
                }
            } catch (e) {
                // Ignore error
            }
        }
    }

    if (!emojiArg) {
        const msg = `${emojis.error} Please provide an emoji or reply to a message with an emoji! Usage: \`/large <emoji>\` or \`?large <emoji>\``;
        if (interaction instanceof Message) return interaction.reply(msg);
        return interaction.reply({ content: msg, ephemeral: true });
    }

    // 2. Parse Emoji ID
    // Regex matches: <a:name:id> or <:name:id>
    const customEmojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
    const match = emojiArg.match(customEmojiRegex);

    if (!match) {
        // Unicode emoji or invalid
        const msg = `${emojis.error} I can only enlarge **Custom Server Emojis**. Unicode emojis (like 😂) are not supported yet.`;
        if (interaction instanceof Message) return interaction.reply(msg);
        return interaction.reply({ content: msg, ephemeral: true });
    }

    const isAnimated = match[1] === "a";
    const name = match[2];
    const id = match[3];
    const extension = isAnimated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${id}.${extension}?size=4096`;

    // 3. Send Embed
    const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setTitle(`Enlarged Emoji: ${name}`)
        .setImage(url)
        .setFooter({ text: `ID: ${id}` });

    // Optional: Add a button to download? (Keeping it simple for now as per request)

    if (interaction instanceof Message) {
        return interaction.reply({ embeds: [embed] });
    } else {
        return interaction.reply({ embeds: [embed] });
    }
};
