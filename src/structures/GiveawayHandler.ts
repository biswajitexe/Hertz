
import {
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextChannel,
    Message,
    ButtonInteraction
} from "discord.js";
import * as config from "../config";
import fs from "fs";
import path from "path";
import { log } from "../logging";

export interface GiveawayData {
    id: string;
    guildId: string;
    channelId: string;
    messageId: string;
    hostId: string;
    prize: string;
    winners: number;
    startTime: number;
    endTime: number;
    participants: string[];
    ended: boolean;
    paused: boolean;
    pausedAt?: number;
}

class GiveawayHandler {
    private giveaways: Map<string, GiveawayData>;
    private timers: Map<string, NodeJS.Timeout>;
    private dataPath: string;
    private client: Client | null;

    constructor() {
        this.giveaways = new Map();
        this.timers = new Map();
        this.dataPath = path.join(__dirname, "../../data/giveaways.json");
        this.client = null;

        // Ensure data directory exists
        const dir = path.dirname(this.dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.loadGiveaways();
    }

    public init(client: Client) {
        this.client = client;
        this.resumeGiveaways();
    }

    private loadGiveaways() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const data = JSON.parse(fs.readFileSync(this.dataPath, "utf8"));
                this.giveaways = new Map(Object.entries(data));
            }
        } catch (err) {
            log(`r{Error loading giveaways: ${err}}`);
        }
    }

    private saveGiveaways() {
        try {
            const data = Object.fromEntries(this.giveaways);
            fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
        } catch (err) {
            log(`r{Error saving giveaways: ${err}}`);
        }
    }

    public createGiveaway(guildId: string, channelId: string, messageId: string, data: Omit<GiveawayData, 'id' | 'guildId' | 'channelId' | 'messageId' | 'participants' | 'ended' | 'paused'>) {
        const giveawayId = `${guildId}-${channelId}-${messageId}`;
        const giveaway: GiveawayData = {
            ...data,
            id: giveawayId,
            guildId,
            channelId,
            messageId,
            participants: [],
            ended: false,
            paused: false,
        };

        this.giveaways.set(giveawayId, giveaway);
        this.saveGiveaways();
        this.startTimer(giveawayId);
        return giveawayId;
    }

    public getGiveaway(giveawayId: string) {
        return this.giveaways.get(giveawayId);
    }

    public getGiveawayByMessage(guildId: string, messageId: string) {
        for (const [_, giveaway] of this.giveaways) {
            if (giveaway.guildId === guildId && giveaway.messageId === messageId) {
                return giveaway;
            }
        }
        return null;
    }

    public async handleEntry(interaction: ButtonInteraction) {
        const giveaway = this.getGiveawayByMessage(interaction.guildId!, interaction.message.id);
        if (!giveaway) return interaction.reply({ content: 'Giveaway not found.', ephemeral: true });

        if (giveaway.ended) return interaction.reply({ content: 'This giveaway differs has ended.', ephemeral: true });

        if (giveaway.participants.includes(interaction.user.id)) {
            // Optional: Allow leaving
            giveaway.participants = giveaway.participants.filter(id => id !== interaction.user.id);
            this.saveGiveaways();
            await this.updateGiveawayMessage(giveaway);
            return interaction.reply({ content: `${config.emojis.error} You have left the giveaway.`, ephemeral: true });
        }

        giveaway.participants.push(interaction.user.id);
        this.saveGiveaways();
        await this.updateGiveawayMessage(giveaway);
        return interaction.reply({ content: `${config.emojis.success} You have entered the giveaway! (**${giveaway.prize}**)`, ephemeral: true });
    }

    public createGiveawayEmbed(giveaway: GiveawayData) {
        const endTime = Math.floor(giveaway.endTime / 1000);
        return new EmbedBuilder()
            .setColor(config.colors.primary)
            .setAuthor({ name: "Giveaway Time!", iconURL: this.client?.user?.displayAvatarURL() })
            .setTitle(`${config.emojis.giveaway || "🎉"} **${giveaway.prize}**`)
            .setDescription(
                [
                    `${config.emojis.dot} **Ends:** <t:${endTime}:R>`,
                    `${config.emojis.dot} **Winners:** ${giveaway.winners}`,
                    `${config.emojis.dot} **Hosted By:** <@${giveaway.hostId}>`,
                    `${config.emojis.dot} **Participants:** ${giveaway.participants.length}`,
                    "",
                    giveaway.paused
                        ? `${config.emojis.pause || "⏸️"} **This giveaway is paused**`
                        : "**React with the button below to enter!**"
                ].join("\n")
            )
            .setThumbnail(this.client?.user?.displayAvatarURL() || null)
            .setFooter({ text: "Giveaways", iconURL: this.client?.user?.displayAvatarURL() })
            .setTimestamp();
    }

    public createGiveawayButton(disabled = false) {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("giveaway_enter")
                .setLabel("Enter Giveaway")
                .setEmoji(config.emojis.giveaway || "🎉")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled),
        );
    }

    private async updateGiveawayMessage(giveaway: GiveawayData) {
        if (!this.client) return;
        try {
            const guild = this.client.guilds.cache.get(giveaway.guildId);
            if (!guild) return;
            const channel = guild.channels.cache.get(giveaway.channelId) as TextChannel;
            if (!channel) return;
            const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
            if (!message) return;

            const embed = this.createGiveawayEmbed(giveaway);
            const button = this.createGiveawayButton(giveaway.ended || giveaway.paused);

            await message.edit({
                embeds: [embed],
                components: [button]
            });
        } catch (err) {
            log(`r{Error updating giveaway message: ${err}}`);
        }
    }

    private startTimer(giveawayId: string) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || giveaway.ended || giveaway.paused) return;

        const timeLeft = giveaway.endTime - Date.now();
        if (timeLeft <= 0) {
            this.endGiveaway(giveawayId);
            return;
        }

        const timer = setTimeout(() => {
            this.endGiveaway(giveawayId);
        }, timeLeft);

        this.timers.set(giveawayId, timer);
    }

    private resumeGiveaways() {
        for (const [id, giveaway] of this.giveaways) {
            if (!giveaway.ended && !giveaway.paused) {
                this.startTimer(id);
            }
        }
    }

    private selectWinners(participants: string[], winnerCount: number) {
        if (participants.length === 0) return [];
        const shuffled = [...participants].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(winnerCount, participants.length));
    }

    public async endGiveaway(giveawayId: string) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || giveaway.ended) return;

        giveaway.ended = true;
        this.saveGiveaways();

        if (!this.client) return;

        try {
            const guild = this.client.guilds.cache.get(giveaway.guildId);
            if (!guild) return;
            const channel = guild.channels.cache.get(giveaway.channelId) as TextChannel;
            if (!channel) return;
            const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
            if (!message) return;

            const winners = this.selectWinners(giveaway.participants, giveaway.winners);

            const endEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`${config.emojis.giveaway || "🎉"} **${giveaway.prize}**`)
                .setDescription(
                    [
                        `${config.emojis.dot} **Hosted by:** <@${giveaway.hostId}>`,
                        `${config.emojis.dot} **Winners:** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(", ") : "No valid participants"}`,
                        `${config.emojis.dot} **Participants:** ${giveaway.participants.length}`,
                        "",
                        `${config.emojis.end || "🛑"} **This giveaway has ended!**`
                    ].join("\n")
                )
                .setFooter({ text: "Ended at" })
                .setTimestamp();

            await message.edit({
                embeds: [endEmbed],
                components: [this.createGiveawayButton(true)]
            });

            if (winners.length > 0) {
                const winnerEmbed = new EmbedBuilder()
                    .setColor(0x000000)
                    .setTitle(`${config.emojis.giveaway || "🎉"} **Giveaway Winner(s)!**`)
                    .setDescription(
                        [
                            `**Prize:** ${giveaway.prize}`,
                            `**Winner(s):** ${winners.map(w => `<@${w}>`).join(", ")}`,
                            "",
                            `Congratulations! You have won **${giveaway.prize}**!`
                        ].join("\n")
                    )
                    .setTimestamp();

                await channel.send({
                    content: winners.map(w => `<@${w}>`).join(" "),
                    embeds: [winnerEmbed]
                });
            } else {
                await channel.send(`${config.emojis.error} No valid participants for the giveaway: **${giveaway.prize}**`);
            }
        } catch (err) {
            log(`r{Error ending giveaway: ${err}}`);
        }
    }

    public async pauseGiveaway(giveawayId: string) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || giveaway.ended || giveaway.paused) return false;

        giveaway.paused = true;
        giveaway.pausedAt = Date.now(); // Track when we paused to adjust endTime on resume?
        // Actually, simple pause just stops timer. If we want to extend, we calculate diff.
        // For now, let's just mark paused.

        const timer = this.timers.get(giveawayId);
        if (timer) clearTimeout(timer);
        this.timers.delete(giveawayId);

        this.saveGiveaways();
        await this.updateGiveawayMessage(giveaway);
        return true;
    }

    public async resumeGiveaway(giveawayId: string) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || giveaway.ended || !giveaway.paused) return false;

        giveaway.paused = false;

        // Adjust end time? 
        // If we want to extend by the duration it was paused:
        // const pauseDuration = Date.now() - (giveaway.pausedAt || Date.now());
        // giveaway.endTime += pauseDuration;
        // Prizon logic usually extends. Let's extend.
        if (giveaway.pausedAt) {
            giveaway.endTime += (Date.now() - giveaway.pausedAt);
            giveaway.pausedAt = undefined;
        }

        this.saveGiveaways();
        this.startTimer(giveawayId);
        await this.updateGiveawayMessage(giveaway);
        return true;
    }

    public async rerollGiveaway(giveawayId: string, channel: TextChannel) {
        const giveaway = this.giveaways.get(giveawayId);
        if (!giveaway || !giveaway.ended) return null;

        const winners = this.selectWinners(giveaway.participants, 1); // Reroll 1 winner usually
        if (winners.length === 0) return null;

        await channel.send({
            content: `${config.emojis.giveaway || "🎉"} **New Winner:** <@${winners[0]}>! (Reroll)`,
            reply: { messageReference: giveaway.messageId }
        });
        return winners[0];
    }

    public getAllGiveaways(guildId: string) {
        const list: GiveawayData[] = [];
        for (const [_, g] of this.giveaways) {
            if (g.guildId === guildId) {
                list.push(g);
            }
        }
        return list;
    }
}

export const giveawayHandler = new GiveawayHandler();
