/* eslint-disable @typescript-eslint/no-explicit-any */

import { Guild, TextChannel, BitFieldResolvable, PermissionString } from 'discord.js';
import { Embed } from '../helpers/embed';

import { notUndefined } from '../helpers/utils';

interface Translations {
    [k: string]: { [k: string]: string };
}

declare interface Subscribers {
    [k: string]: User;
}

interface User {
    channels: string[];
    settings: Settings;
}

type language = 'ru' | 'en';

export declare interface Settings {
    language: language;
    timezone: string;
    pledgesLang: string;
    luxuryLang: string;
    merchantsLang: string;
    newsLang: language;
}

// ADD NEW

export declare interface NotifyData {
    translations: Translations;
    data: unknown;
    subscribers: Subscribers;
    settings: Settings;
}

interface GuildChannel {
    id: string;
    guild: Guild;
    channel: TextChannel;
}

interface AssistantGuild {
    guild: Guild;
    channels: GuildChannel[];
    settings: Settings;
}

export declare interface Subscription {
    notify(): Promise<void>;
}

class Subscriptions {
    client: Assistant;

    name: string;
    translations: Translations;
    data: unknown;
    subscribers: Subscribers;
    settings: Settings;
    events: { [k: string]: ((data: any) => void)[] };

    rights = [
        { permission: 'EMBED_LINKS' },
        { permission: 'SEND_MESSAGES' },
        { permission: 'VIEW_CHANNEL' }
    ] as { permission: BitFieldResolvable<PermissionString> }[];

    guilds: AssistantGuild[]

    // notify: () => Promise<void> | void;

    constructor(
        client: Assistant,
        { translations, data, subscribers, settings }: NotifyData,
        name: string
    ) {
        this.client = client;
        this.name = name.toUpperCase();

        this.translations = translations;
        this.data = data;
        this.subscribers = subscribers;
        this.settings = settings;

        this.events = {};

        this.guilds = this.client.guilds.cache
            .filter(({ id }) => `${id}` in subscribers)
            .map(guild => {
                const guildSettings = {
                    ...settings,
                    ...subscribers[guild.id].settings
                };

                const channels = subscribers[guild.id]
                    .channels
                    .map(id => {
                        const channel = guild.channels.cache.get(`${id}`);

                        if(channel) {
                            return { id, guild, channel };
                        }
                    })
                    .filter(notUndefined) as GuildChannel[];

                return {
                    guild,
                    channels,
                    settings: guildSettings
                };
            });
    }

    // notify(): Promise<void> | void {}

    async send(builder: (settings: Settings, id: string) => Embed): Promise<void> {
        const CHUNK_SIZE = 10;

        const messages: { channel: TextChannel; message: Embed }[][] = [[]]; // [[{ channel, message }]]

        this.guilds.forEach(({ channels, guild, settings }) => {
            const message = builder(settings, guild.id);

            if (!message) {
                this.client.logger.error('SubscriptionsError', `No message for ${this.name} (${guild.id}).`);
                return;
            }

            const { footer, name } = this.translations;

            const subName = `[${name[settings.language]}]`;

            if(!message.footer?.text || !message.footer.text.includes(subName)) {
                message.setFooter(`${message.footer?.text || footer[settings.language]} ${subName}`);
            }

            const allowed = channels
                .filter(channel => this.filter(channel, settings), this)
                .map(({ channel }) => ({ channel, message }));

            const last = messages[messages.length - 1];

            if(last.length < CHUNK_SIZE) {
                last.push(...allowed);
            } else {
                messages.push([...allowed]);
            }
        });

        type ErrorResult = {
            err: any;
            channel: TextChannel;
        }

        const result = {
            success: 0,
            errors: [] as ErrorResult[]
        };

        const length = messages.length;

        for(let i = 0; i < length; i++) {
            const chunk = messages[i];

            const promises = chunk.map(({ channel, message }) => channel.send(message));

            const chunkResult = (await Promise.allSettled(promises)).reduce((acc, result, i) => {
                if(result.status === 'fulfilled') {
                    acc.success++;
                    return acc;
                }

                acc.errors.push({ err: result.reason, channel: chunk[i].channel });

                return acc;
            }, { success: 0, errors: [] as ErrorResult[] });

            this.client.logger.log(`[${this.name}] Chunk ${i} out of ${length} sent.`)

            result.success += chunkResult.success;
            result.errors.push(...chunkResult.errors);
        }

        this.client.logger.log(`[${this.name}] Message was successfully sent to ${result.success} channels.`);

        result.errors.forEach(({ err, channel }) => {
            this.client.logger.error('SubscriptionsError', `${channel.name} (guildID: ${channel.guild.id}): ` + err)
        });
    }

    filter({ channel, id, guild }: GuildChannel, settings: Settings): boolean {
        if (!channel) {
            this.client.logger.error('SubscriptionsError', `Channel ${id} from '${guild.name}' doesn't exist.`);

            this.emit('referenceError', { id, guild });

            return false;
        }

        const errors = this.rights
            .filter(({ permission }) => {
                if(!guild.me) {
                    return true;
                }

                const permissions = channel.permissionsFor(guild.me);

                if(!permissions) {
                    return true;
                }

                return !permissions.has(permission);
            })
            .map(({ permission }) => {
                this.client.logger.error(
                    'SubscriptionsError',
                    `Channel ${channel.name} (${id}) from '${guild.name}' doesn't have permission '${permission}' or doesn't include me!`
                );

                this.emit('permissionError', { permission, channel, guild, settings });
            }, this);

        return !errors.length;
    }

    emit(name: string, data: unknown): void {
        const events = this.events[name];

        if (events) {
            events.forEach(func => func.call(this, data));
        }
    }

    on(name: 'referenceError', func: (data: { id: string; guild: Guild }) => void): void
    on(name: 'permissionError', func: (data: { permission: string; channel: TextChannel; guild: Guild; settings: Settings }) => void): void
    on(name: string, func: (data: any) => void): void {
        if (!this.events[name]) {
            this.events[name] = [];
        }

        this.events[name].push(func);
    }
}

export { Subscriptions };