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
        { permission: 'SEND_MESSAGES' }
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

    send(builder: (settings: Settings, id: string) => Embed): void {
        const success = this.guilds.reduce((total, { channels, guild, settings }) => {
            const message = builder(settings, guild.id);

            if (!message) {
                this.client.logger.error('SubscriptionsError', `No message for ${this.name} (${guild.id}).`);

                return total;
            }

            const { footer, name } = this.translations;

            const subName = `[${name[settings.language]}]`;

            if(!message.footer?.text || message.footer?.text && !message.footer.text.includes(subName)) {
                message.setFooter(`${message.footer?.text || footer[settings.language]} ${subName}`);
            }

            const allowed = channels
                .filter(channel => this.filter(channel, settings), this)
                .map(async ({ channel }) => {
                    // дописать
                    channel.send(message)
                        .catch(err => {
                            this.client.logger.error('SubscriptionsError', `${channel.name} (${guild.id}): ` + err);
                        });
                });

            return total + allowed.length;
        }, 0);

        this.client.logger.log(`[${this.name}] Message was successfully sent to ${success} channels.`);
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

        if (errors.length) {
            return false;
        }

        return true;
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