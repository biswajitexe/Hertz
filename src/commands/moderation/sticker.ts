import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { createErrorEmbed } from "../../utilities/embedUtils";
import { V2Embed } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('sticker')
    .setDescription('Steal a sticker (from attachment or URL)')
    .addAttachmentOption(option =>
        option.setName('file')
            .setDescription('The sticker file (PNG/GIF)')
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('name')
            .setDescription('Name for the new sticker')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers);

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.inCachedGuild()) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageEmojisAndStickers) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorEmbed(interaction.user, "**You do not have permission to manage stickers.**").toPayload({ ephemeral: true }));
    }

    const attachmentOption = interaction.options.getAttachment('file', false);
    let name = interaction.options.getString('name', false);

    let attachment = attachmentOption;

    if (!attachment) {
        const msg = (interaction as any).message;
        if (msg && msg.reference && msg.reference.messageId) {
            try {
                const referencedMsg = await msg.channel.messages.fetch(msg.reference.messageId);
                if (referencedMsg) {
                    if (referencedMsg.stickers.size > 0) {
                        const stickerItem = referencedMsg.stickers.first();
                        if (stickerItem.format === 1 || stickerItem.format === 2 || stickerItem.format === 4) {
                            attachment = { url: stickerItem.url, contentType: 'image/png' } as any;
                            if (!name) name = stickerItem.name;
                        }
                    } else if (referencedMsg.attachments.size > 0) {
                        attachment = referencedMsg.attachments.first() || null;
                    }
                }
            } catch (e) {
                console.log("Failed to fetch referenced message for sticker:", e);
            }
        }
    }

    if (!attachment) {
        return interaction.reply(createErrorEmbed(interaction.user, "**Please provide a file or reply to a sticker/image.**").toPayload({ ephemeral: true }));
    }

    if (!name) {
        if ((attachment as any).name) {
            name = (attachment as any).name.replace(/\.[^/.]+$/, "");
        } else {
            name = "sticker_" + Date.now().toString().slice(-4);
        }
    }

    name = name!.replace(/[^a-zA-Z0-9_]/g, '');
    if (name.length < 2) name = "sticker_" + Date.now().toString().slice(-4);

    const validTypes = ['image/png', 'image/jpeg', 'image/gif'];
    if (attachment.contentType && !validTypes.some(t => attachment.contentType?.startsWith(t))) {
        return interaction.reply(createErrorEmbed(interaction.user, "**Invalid file type. Please provide a PNG, JPG, or GIF.**").toPayload({ ephemeral: true }));
    }

    try {
        await interaction.deferReply();
        const sticker = await interaction.guild.stickers.create({
            file: attachment.url,
            name: name,
            tags: name
        });

        const embed = new V2Embed()
            .setColor(config.colors.success)
            .setTitle('Sticker Added')
            .setDescription(`${config.emojis.success} **Added sticker:** \`${name}\``)
            .setImage(sticker.url);

        await interaction.editReply(embed.toPayload());

    } catch (err: any) {
        console.error(err);
        let errorMsg = "Failed to add sticker.";
        if (err.code === 30039) errorMsg = "Maximum number of stickers reached.";

        await interaction.editReply(createErrorEmbed(interaction.user, `**${errorMsg}**`).toPayload());
    }
}
