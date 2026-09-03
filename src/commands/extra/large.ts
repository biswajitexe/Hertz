import { 
    SlashCommandBuilder, 
    Message
} from "discord.js";
import { emojis, colors } from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

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
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
        emojiArg = interaction.options.getString("emoji") || "";
    } else if (interaction instanceof Message) {
        const args = interaction.content.split(" ").slice(1);
        emojiArg = args[0] || "";

        // Check for Reply if no emoji arg provided
        if (!emojiArg && interaction.reference && interaction.reference.messageId) {
            try {
                const replyMessage = await interaction.channel.messages.fetch(interaction.reference.messageId);
                if (replyMessage && replyMessage.content) {
                    const customEmojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
                    const match = replyMessage.content.match(customEmojiRegex);
                    if (match) {
                        emojiArg = match[0];
                    }
                }
            } catch (e) {
                // Ignore error
            }
        }
    }

    if (!emojiArg) {
        const err = createErrorV2(`Please provide an emoji or reply to a message with an emoji! Usage: \`/large <emoji>\` or \`?large <emoji>\``);
        if (interaction instanceof Message) return interaction.reply(err.toPayload());
        return interaction.reply(err.toPayload({ ephemeral: true }));
    }

    // 2. Parse Emoji ID
    const customEmojiRegex = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
    const match = emojiArg.match(customEmojiRegex);

    if (!match) {
        const err = createErrorV2(`I can only enlarge **Custom Server Emojis**. Unicode emojis (like 😂) are not supported yet.`);
        if (interaction instanceof Message) return interaction.reply(err.toPayload());
        return interaction.reply(err.toPayload({ ephemeral: true }));
    }

    const isAnimated = match[1] === "a";
    const name = match[2];
    const id = match[3];
    const extension = isAnimated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${id}.${extension}?size=4096`;

    // 3. Send V2 Embed
    const embed = new V2Embed()
        .setColor(colors.primary)
        .setTitle(`Enlarged Emoji: :${name}:`)
        .setImage(url)
        .setFooter(`ID: ${id}`);

    return interaction.reply(embed.toPayload());
};
