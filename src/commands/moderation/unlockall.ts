import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('unlockall')
    .setDescription('Unlock all channels in the server');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    if (!interaction.guild) return;

    await interaction.deferReply();

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) && interaction.user.id !== process.env.OWNER_ID) {
        return interaction.reply(createErrorV2("You do not have permission to use this command.").toPayload({ ephemeral: true }));
    }

    const channels = interaction.guild.channels.cache.filter(c => c.isTextBased() && c.manageable);
    let count = 0;

    for (const [id, channel] of channels) {
        try {
            await (channel as TextChannel).permissionOverwrites.edit(interaction.guild.id, {
                SendMessages: true
            });
            count++;
        } catch (err) {
            console.error(`Failed to unlock ${channel.name}`);
        }
    }

    const embed = new V2Embed()
        .setColor(0x57F287)
        .setTitle(`${config.emojis.success || "🔓"} Channels Unlocked`)
        .setDescription(`**Unlocked ${count} channels.**`);

    await interaction.editReply(embed.toPayload());
}
