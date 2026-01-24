
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";

export const command = new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Clone and delete the current channel (clears all messages)')
    .setDescription('Clone and delete the current channel (clears all messages)');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild || !interaction.channel) return;

    const channel = interaction.channel as TextChannel;

    // Permission Check
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply({ content: `${config.emojis.error} You do not have permission to use this command.`, ephemeral: true });
    }

    if (!channel.clone) {
        return interaction.reply({ content: `${config.emojis.error} This channel type cannot be nuked.`, ephemeral: true });
    }

    // Confirmation logic could be added, but for speed I will nuke directly as per slash command expectation (or add a button)
    // Adding a quick confirmation button is safer.

    // Wait, let's keep it simple: Action -> Reaction.
    // User requested "Port", Prizon had confirmation. I'll simply clone and delete.

    try {
        const confirmEmbed = new EmbedBuilder()
            .setColor(config.colors.warning || 0xFFA500)

            .setDescription(`**Are you sure you want to nuke this channel?**\nThis will **permanently delete** all messages and clone the channel.`)
            .setFooter({ text: 'This action cannot be undone.' });

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

        const reply = await interaction.reply({ embeds: [confirmEmbed], components: [buttons], fetchReply: true });

        const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Only the person who requested the nuke can confirm it.', ephemeral: true });
            }

            if (i.customId === 'nuke_confirm') {
                await i.reply({ content: 'Nuking channel...', ephemeral: true });

                const newChannel = await channel.clone({ position: channel.position });
                await channel.delete();

                const successEmbed = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif')
                    .setDescription(`${config.emojis.success || "💥"} **Channel Nuked!**\nAll messages have been cleared.`);

                await newChannel.send({ embeds: [successEmbed] });
                await newChannel.send({ content: `Action performed by <@${interaction.user.id}>` });

            } else if (i.customId === 'nuke_cancel') {
                await i.update({ content: 'Nuke action cancelled.', embeds: [], components: [] });
                setTimeout(() => interaction.deleteReply().catch(() => { }), 5000);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                // interaction.editReply({ content: 'Nuke confirmation timed out.', embeds: [], components: [] }).catch(() => { });
                interaction.deleteReply().catch(() => { });
            }
        });

    } catch (err) {
        console.error(err);
    }


}
