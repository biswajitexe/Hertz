import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Database } from "../../database";
import * as config from "../../config";
import { V2Embed, createErrorV2 } from "../../utilities/componentV2";

export const command = new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reloads the bot (Owner Only)');

export async function run(interaction: ChatInputCommandInteraction, database: Database) {
    const botConfig = await database.getBotConfig();
    const owners = (process.env.OWNER_ID || "").split(',').map(id => id.trim());
    if (botConfig?.ownerUsers) owners.push(...botConfig.ownerUsers);
    if (botConfig?.developerUsers) owners.push(...botConfig.developerUsers);

    if (!owners.includes(interaction.user.id)) {
        return interaction.reply(createErrorV2('Unknown command.').toPayload({ ephemeral: true }));
    }

    const embed = new V2Embed()
        .setColor(config.colors.primary)
        .setTitle('<:74658vipglow:1465051133704798435> Reloading Bot')
        .setDescription(`> **Reloading bot logic...** (This may take a moment)`)
        .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
        .setFooter(`Requested by ${interaction.user.username}`, interaction.user.displayAvatarURL());

    await interaction.reply(embed.toPayload({ ephemeral: true }));

    console.log("[Reload] Triggered by owner. Exiting...");
    process.exit(0);
}
