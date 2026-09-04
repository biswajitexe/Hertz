import { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder,
    CommandInteraction,
    Message
} from "discord.js";
import { translate } from 'google-translate-api-x';
import { emojis, colors } from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

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

    if (!(interaction instanceof CommandInteraction)) {
        const message = interaction as Message;

        if (message.reference && message.reference.messageId) {
            try {
                replyMessage = await message.channel.messages.fetch(message.reference.messageId);
                if (replyMessage && replyMessage.content) {
                    textToTranslate = replyMessage.content;
                    isReply = true;
                }
            } catch (e) {
            }
        }
        
        if (!textToTranslate) {
            const args = message.content.split(" ").slice(1);
            if (args.length > 0) {
                 if (args[0].length === 2 && args.length > 1) {
                     targetLang = args[0];
                     textToTranslate = args.slice(1).join(" ");
                 } else {
                     textToTranslate = args.join(" ");
                 }
            }
        }
    } else {
        if (interaction.isChatInputCommand()) {
             textToTranslate = interaction.options.getString("text", true);
             targetLang = interaction.options.getString("to") || "en";
        }
    }

    let contentToCheck = "";
    if (interaction instanceof Message) {
        contentToCheck = interaction.content;
    }
    
    if (isReply && interaction instanceof Message && !contentToCheck.split(" ").slice(1).length) {
        return sendLanguageDropdown(interaction, textToTranslate);
    }

    if (!textToTranslate) {
        const err = createErrorV2("Please provide text to translate or reply to a message!");
        if (interaction instanceof Message) return interaction.reply(err.toPayload());
        return interaction.reply(err.toPayload({ ephemeral: true }));
    }

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
    
    const embed = new V2Embed()
        .setColor(colors.default)
        .setTitle("Language Selection")
        .setDescription(`> Select a language below to translate the specified text.\n\n• **Text Preview:** \`${text.substring(0, 100)}${text.length > 100 ? '...' : ''}\``)
        .setFooter(`Requested by ${interaction.member?.user?.username || interaction.author?.username || interaction.user?.username}! | Powered by Hertz`);

    if (interaction instanceof Message) {
         const msg = await interaction.reply(embed.toPayload({ extraComponents: [row] }));
         
         const targetId = interaction.reference?.messageId;
         if (targetId) {
             const newMenu = new StringSelectMenuBuilder(selectMenu.toJSON())
                 .setCustomId(`translate_sel_${interaction.author.id}_${targetId}`);
             const newRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(newMenu);
             await msg.edit(embed.toPayload({ extraComponents: [newRow] }));
         }
    } else {
        await interaction.reply(embed.toPayload({ extraComponents: [row], ephemeral: true }));
    }
}

async function performTranslation(interaction: any, text: string, targetLang: string) {
    let replyMsg: any;
    if (interaction instanceof Message) {
        replyMsg = await interaction.reply({ content: "Translating..." });
    } else {
        await interaction.deferReply();
    }

    try {
        const res: any = await translate(text, { to: targetLang });
        
        const embed = new V2Embed()
            .setColor(colors.default)
            .setTitle("Translation Result")
            .setDescription(`> Successfully translated text.\n\n• **Original (${res.from?.language?.iso || 'auto'}):**\n\`\`\`\n${text.substring(0, 1000)}\n\`\`\`\n• **Translated (${targetLang}):**\n\`\`\`\n${res.text.substring(0, 1000)}\n\`\`\``)
            .setFooter(`Requested by ${interaction.member?.user?.username || interaction.author?.username || interaction.user?.username}! | Powered by Hertz`);

        if (interaction instanceof Message) {
            await replyMsg.edit({ content: null, ...embed.toPayload() });
        } else {
            await interaction.editReply(embed.toPayload());
        }

    } catch (e) {
        console.error(e);
        const errEmbed = createErrorV2("Failed to translate. Please check the language code.");
            
        if (interaction instanceof Message) {
            await replyMsg.edit({ content: null, ...errEmbed.toPayload() });
        } else {
            await interaction.editReply(errEmbed.toPayload());
        }
    }
}

// Interaction Handler for Dropdown
export const handleInteraction = async (interaction: any, database: any) => {
    if (!interaction.isStringSelectMenu()) return;
    
    const parts = interaction.customId.split("_");
    if (parts[0] !== "translate" || parts[1] !== "sel") return;
    
    const ownerId = parts[2];
    const targetMsgId = parts[3];
    
    if (interaction.user.id !== ownerId) {
        return interaction.reply(createErrorV2("This menu is not for you!").toPayload({ ephemeral: true }));
    }
    
    const selectedLang = interaction.values[0];
    await interaction.deferUpdate();
    
    try {
        const targetMsg = await interaction.channel.messages.fetch(targetMsgId);
        if (!targetMsg) {
            return interaction.followUp(createErrorV2("Original message not found.").toPayload({ ephemeral: true }));
        }
        
        const text = targetMsg.content;
        const res: any = await translate(text, { to: selectedLang });
        
        const embed = new V2Embed()
            .setColor(colors.default)
            .setTitle("Translation Result")
            .setDescription(`> Successfully translated text.\n\n• **Original (${res.from?.language?.iso || 'auto'}):**\n\`\`\`\n${text.substring(0, 1000)}\n\`\`\`\n• **Translated (${selectedLang}):**\n\`\`\`\n${res.text.substring(0, 1000)}\n\`\`\``)
            .setFooter(`Requested by ${interaction.user.username}! | Powered by Hertz`);
            
        await interaction.editReply({ content: null, ...embed.toPayload() });
        
    } catch (e) {
        console.error(e);
        await interaction.followUp(createErrorV2("Translation failed.").toPayload({ ephemeral: true }));
    }
};
