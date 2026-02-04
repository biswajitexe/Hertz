
import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    ComponentType,
    CommandInteraction,
    Message
} from "discord.js";
import { translate } from 'google-translate-api-x';
import { emojis, colors } from "../../config";

export const command = new SlashCommandBuilder()
    .setName("translate")
    .setDescription("Translate text to another language")
    .addStringOption(option => 
        option.setName("text")
            .setDescription("The text to translate")
            .setRequired(true)
    )
    .addStringOption(option => 
        option.setName("to")
            .setDescription("Target language (e.g. hi, en, es)")
            .setRequired(false)
    );

// Indian Languages First
const INDIAN_LANGUAGES = [
    { label: "Hindi (हिंदी)", value: "hi", emoji: "🇮🇳" },
    { label: "Bengali (বাংলা)", value: "bn", emoji: "🇮🇳" },
    { label: "Marathi (मराठी)", value: "mr", emoji: "🇮🇳" },
    { label: "Telugu (తెలుగు)", value: "te", emoji: "🇮🇳" },
    { label: "Tamil (தமிழ்)", value: "ta", emoji: "🇮🇳" },
    { label: "Gujarati (ગુજરાતી)", value: "gu", emoji: "🇮🇳" },
    { label: "Urdu (اردو)", value: "ur", emoji: "🇮🇳" },
    { label: "Kannada (ಕನ್ನಡ)", value: "kn", emoji: "🇮🇳" },
    { label: "Malayalam (മലയാളം)", value: "ml", emoji: "🇮🇳" },
    { label: "Punjabi (ਪੰਜਾਬੀ)", value: "pa", emoji: "🇮🇳" }
];

const GLOBAL_LANGUAGES = [
    { label: "English", value: "en", emoji: "🇺🇸" },
    { label: "Spanish", value: "es", emoji: "🇪🇸" },
    { label: "French", value: "fr", emoji: "🇫🇷" },
    { label: "German", value: "de", emoji: "🇩🇪" },
    { label: "Russian", value: "ru", emoji: "🇷🇺" },
    { label: "Japanese", value: "ja", emoji: "🇯🇵" },
    { label: "Korean", value: "ko", emoji: "🇰🇷" },
    { label: "Chinese (Simplified)", value: "zh-CN", emoji: "🇨🇳" }
];

export const run = async (interaction: any, database: any) => {
    let textToTranslate = "";
    let targetLang = "en";
    let isReply = false;
    let replyMessage: Message | null = null;

    // Handle Prefix Command Logic
    if (!(interaction instanceof CommandInteraction)) { // It's a Message object in prefix handler
        const message = interaction as Message;

        // Check for Reply
        if (message.reference && message.reference.messageId) {
            try {
                replyMessage = await message.channel.messages.fetch(message.reference.messageId);
                if (replyMessage && replyMessage.content) {
                    textToTranslate = replyMessage.content;
                    isReply = true;
                }
            } catch (e) {
                // Ignore fetch error
            }
        }
        
        // If no reply or reply has no content, check args
        if (!textToTranslate) {
            // "translate <text>" OR "tl <text>"
            // Prefix handler usually strips command name. 
            // We need to parse args manually if passed as Message.
            // Assuming 'args' are passed or we parse content.
            // For now, let's assume if it came from prefix handler, we handle args there 
            // OR we just take the content after the command.
            
            // Simplified: If message content is just "?tl" or "?translate" and it IS a reply -> Show Menu
            // If message content has extra text -> Translate that text
            
            // Note: The main index.ts logic handles distinct args. 
            // Since we don't have direct access to 'args' here unless passed, we'll try to guess.
            
            // Actually, for the dropdown feature, we ONLY want to trigger it if:
            // 1. It IS a reply
            // 2. The user did NOT specify a target language (just typed ?tl)
            
            const args = message.content.split(" ").slice(1);
            if (args.length > 0) {
                 // Format: ?tl hi Hello World OR ?tl Hello World
                 // It's hard to distinguish "hi" as lang vs text.
                 // Simple logic: If arg[0] is 2 chars, assume lang.
                 if (args[0].length === 2 && args.length > 1) {
                     targetLang = args[0];
                     textToTranslate = args.slice(1).join(" ");
                 } else {
                     textToTranslate = args.join(" ");
                 }
            }
        }
    } else {
        // Slash Command
        if (interaction.isChatInputCommand()) {
             textToTranslate = interaction.options.getString("text", true);
             targetLang = interaction.options.getString("to") || "en";
        }
    }

    // If it's a Reply AND User didn't specify text/lang explicitly (just ?tl), Show Dropdown
    // For Slash Commands, we don't have this 'reply' logic in the same way effectively unless we add a user/message option, but keeping it simple.
    let contentToCheck = "";
    if (interaction instanceof Message) {
        contentToCheck = interaction.content;
    }
    
    if (isReply && interaction instanceof Message && !contentToCheck.split(" ").slice(1).length) {
        return sendLanguageDropdown(interaction, textToTranslate);
    }

    if (!textToTranslate) {
        return interaction.reply({ content: `${emojis.error} Please provide text to translate or reply to a message!`, ephemeral: true });
    }

    // Direct Translation
    await performTranslation(interaction, textToTranslate, targetLang);
};

async function sendLanguageDropdown(interaction: any, text: string) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`translate_select_${interaction.author?.id || interaction.user?.id}`)
        .setPlaceholder("Select a Language (Indian Languages prioritized)")
        .addOptions(
            ...INDIAN_LANGUAGES.map(l => new StringSelectMenuOptionBuilder().setLabel(l.label).setValue(l.value).setEmoji(l.emoji)),
            ...GLOBAL_LANGUAGES.map(l => new StringSelectMenuOptionBuilder().setLabel(l.label).setValue(l.value).setEmoji(l.emoji))
        );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    
    // Convert text to Base64 to store in customId or Cache?
    // Text can be long. Best to rely on fetching the ORIGINAL message again or cache.
    // For simplicity, we will encode the text in a temporary cache or just fetch the reference again in handler.
    // BUT, interaction.customId limit is 100.
    
    // STRATEGY: Store the 'messageId' of the message to translate in the customID (if reply).
    // If we can't get messageId easily in interaction handler (ephemeral?), we might need a DB or Cache.
    // Let's use the 'message.reference.messageId' logic in the handler.
    
    const embed = new EmbedBuilder()
        .setColor(colors.primary)
        .setDescription(`**Select a language to translate the text:**\n> ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);

    if (interaction instanceof Message) {
         const msg = await interaction.reply({ embeds: [embed], components: [row] });
         // Store mapping: interactionMsgId -> targetMsgId
         // For now, let's rely on the user replying to the same message? No.
         // Let's modify customId to include target Message ID?
         // translate_select_<userId>_<targetMessageId>
         
         const targetId = interaction.reference?.messageId;
         if (targetId) {
             const newMenu = new StringSelectMenuBuilder(selectMenu.toJSON())
                 .setCustomId(`translate_sel_${interaction.author.id}_${targetId}`);
             const newRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(newMenu);
             await msg.edit({ components: [newRow] });
         }
    } else {
        // Slash command reply logic (rarely used for this specific reply flow but good to have)
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
}

async function performTranslation(interaction: any, text: string, targetLang: string) {
    // Initial Feedback
    let replyMsg;
    if (interaction instanceof Message) {
        replyMsg = await interaction.reply({ content: `${emojis.loading || '⏳'} Translating...` });
    } else if (interaction.isRepliable()) {
        await interaction.deferReply();
    }

    try {
        const res: any = await translate(text, { to: targetLang });
        
        const embed = new EmbedBuilder()
            .setColor(0x4285F4) // Google Blue
            .setAuthor({ name: "Translation Result", iconURL: "https://upload.wikimedia.org/wikipedia/commons/d/db/Google_Translate_Icon.png" })
            .addFields(
                { name: `Original (${res.from?.language?.iso || 'auto'})`, value: `> ${text.substring(0, 1000)}` },
                { name: `Translated (${targetLang})`, value: `> ${res.text.substring(0, 1000)}` }
            )
            .setFooter({ text: `Requested by ${interaction.member?.user?.username || interaction.author?.username}` });

        if (interaction instanceof Message) {
            await replyMsg.edit({ content: null, embeds: [embed], components: [] });
        } else {
            await interaction.editReply({ embeds: [embed], components: [] });
        }

    } catch (e) {
        console.error(e);
        const errEmbed = new EmbedBuilder()
            .setColor(colors.error)
            .setDescription(`${emojis.error} Failed to translate. Please check the language code.`);
            
        if (interaction instanceof Message) {
            await replyMsg.edit({ content: null, embeds: [errEmbed] });
        } else {
            await interaction.editReply({ embeds: [errEmbed] });
        }
    }
}

// Interaction Handler for Dropdown
export const handleInteraction = async (interaction: any, database: any) => {
    if (!interaction.isStringSelectMenu()) return;
    
    // CustomId: translate_sel_<userId>_<targetMsgId>
    const parts = interaction.customId.split("_");
    if (parts[0] !== "translate" || parts[1] !== "sel") return;
    
    const ownerId = parts[2];
    const targetMsgId = parts[3];
    
    if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: `${emojis.error} This menu is not for you!`, ephemeral: true });
    }
    
    const selectedLang = interaction.values[0];
    
    await interaction.deferUpdate();
    
    // Fetch original text
    try {
        const targetMsg = await interaction.channel.messages.fetch(targetMsgId);
        if (!targetMsg) {
            return interaction.followUp({ content: "Original message not found.", ephemeral: true });
        }
        
        const text = targetMsg.content;
        const res: any = await translate(text, { to: selectedLang });
        
        const embed = new EmbedBuilder()
            .setColor(0x4285F4)
            .setAuthor({ name: "Translation Result", iconURL: "https://upload.wikimedia.org/wikipedia/commons/d/db/Google_Translate_Icon.png" })
            .addFields(
                { name: `Original (${res.from?.language?.iso || 'auto'})`, value: `> ${text.substring(0, 1000)}` },
                { name: `Translated (${selectedLang})`, value: `> ${res.text.substring(0, 1000)}` }
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` });
            
        await interaction.editReply({ content: null, embeds: [embed], components: [] });
        
    } catch (e) {
        console.error(e);
        await interaction.followUp({ content: "Translation failed.", ephemeral: true });
    }
};
