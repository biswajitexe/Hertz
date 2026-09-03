import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2, createWarningV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Clone and delete the current channel (clears all messages)');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild || !interaction.channel) return;

    const channel = interaction.channel as TextChannel;

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2("You do not have permission to use this command.").toPayload({ ephemeral: true }));
    }

    if (!channel.clone) {
        return interaction.reply(createErrorV2("This channel type cannot be nuked.").toPayload({ ephemeral: true }));
    }

    try {
        const confirmEmbed = new V2Embed()
            .setColor(config.colors.warning || 0xFFA500)
            .setTitle('⚠️ Confirm Channel Nuke')
            .setDescription(`**Are you sure you want to nuke this channel?**\nThis will **permanently delete** all messages and clone the channel.`)
            .setFooter('This action cannot be undone.');

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('nuke_confirm')
                .setLabel('Yes, Nuke it!')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('nuke_cancel')
                .setLabel('No, Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        const reply = await interaction.reply({
            ...confirmEmbed.toPayload({ extraComponents: [buttons] }),
            fetchReply: true
        });

        const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply(createErrorV2('Only the person who requested the nuke can confirm it.').toPayload({ ephemeral: true }));
            }

            if (i.customId === 'nuke_confirm') {
                await i.reply(createWarningV2('Nuking channel...').toPayload({ ephemeral: true }));

                const newChannel = await channel.clone({ position: channel.position });
                await channel.delete();

                const successEmbed = new V2Embed()
                    .setColor(0xED4245)
                    .setTitle(`${config.emojis.success || "💥"} Channel Nuked!`)
                    .setDescription(`All messages have been cleared.`)
                    .setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif');

                await newChannel.send(successEmbed.toPayload());
                await newChannel.send({ content: `Action performed by <@${interaction.user.id}>` });

            } else if (i.customId === 'nuke_cancel') {
                await i.update({ content: 'Nuke action cancelled.', components: [] });
                setTimeout(() => interaction.deleteReply().catch(() => { }), 5000);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.deleteReply().catch(() => { });
            }
        });

    } catch (err) {
        console.error(err);
    }
}
