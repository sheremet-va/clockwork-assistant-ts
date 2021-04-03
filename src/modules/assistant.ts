import { ErrorEmbed, ClientError } from './error';
import { Client, Collection, TextChannel, DMChannel } from 'discord.js';
import { promisify } from 'util';

import { AssistantMessage as Message, RequestInfo, AssistantMessage } from '../types';

import Enmap from 'enmap';

import { config } from '../config';
import { Logger } from './logger';

import axios, { AxiosRequestConfig } from 'axios';
import { Settings } from './subscriptions';
import { Embed } from '../helpers/embed';

import { clean } from '../helpers/utils';

const LIMIT_REPEAT_GET = 3;

const prefixes = new Enmap<string, string>('prefixes');

function build(logger: Logger): void {
    Object.defineProperty(String.prototype, 'capitalize', {
        value() {
            if (!this || this === '') return '';
            return this.charAt(0).toUpperCase() + this.slice(1);
        }
    });

    Object.defineProperty(String.prototype, 'render', {
        value(replaces: Record<string, string>) {
            return Object.entries(replaces).reduce((final, [replace, string]) => {
                const replaceWord = new RegExp(`{{\\s*${replace}\\s*}}`, 'g');

                return final.replace(replaceWord, string);
            }, this);
        }
    });

    Object.defineProperty(String.prototype, 'toLowerFirst', {
        value() {
            if (!this || this === '') return '';
            return this.charAt(0).toLowerCase() + this.slice(1);
        }
    });

    Object.defineProperty(Array.prototype, 'random', {
        value() {
            return this[Math.floor(Math.random() * this.length)];
        }
    });

    Object.defineProperty(Number.prototype, 'pluralize', {
        value(array: string[], lang: string) {
            switch (lang) {
                case 'ru':
                    return `${this} ${array[(this % 10 === 1 && this % 100 !== 11)
                        ? 0
                        : this % 10 >= 2 && this % 10 <= 4 && (this % 100 < 10 || this % 100 >= 20)
                            ? 1
                            : 2]}`;
                case 'en':
                default:
                    return `${this} ${array[this > 1 ? 1 : 0]}`;
            }
        }
    });

    process.on('uncaughtException', err => {
        const errorMsg = (err.stack || '').replace(new RegExp(`${__dirname}/`, 'g'), './');

        logger.error('Uncaught Exception', err.message, errorMsg);
    });

    process.on('unhandledRejection', (err: unknown) => {
        if (err instanceof ClientError) {
            const message = err.message || err.description;

            return err.channel
                ? err.channel.send(new ErrorEmbed(message))
                : logger.error('ClientErrorRejection', message);
        }

        if(err instanceof Error) {
            const message = err.message;

            return logger.error(
                'Unhandled rejection',
                message.replace(new RegExp(`${__dirname}/`, 'g'), './'),
                err.stack
            );
        }
    });

    process.on('warning', err => logger.error('warning', err.message, err.stack));
}

interface Conf {
    enabled: boolean;
    guildOnly: boolean;
    helpShown: boolean;
    permLevel: string;
    path?: string;
}

interface Command {
    run: (client: Assistant, message: AssistantMessage, info: RequestInfo, args: string[]) => Promise<Embed | boolean | string>;
    conf: Conf;
}

class AssistantBase extends Client {
    config: config;
    logger: Logger;

    commands: Collection<string, Command>; // string, Command
    aliases: Collection<string, string>;

    prefixes: Enmap<string, string>; // TODO type

    levelCache!: { [k: string]: number };

    wait: (seconds: number) => Promise<void>;

    constructor() {
        super({
            messageCacheMaxSize: 1,
            messageCacheLifetime: 1,
            messageSweepInterval: 1
        });

        this.config = config;
        this.logger = new Logger(this);

        this.commands = new Collection();
        this.aliases = new Collection();

        this.prefixes = prefixes;

        this.wait = promisify(setTimeout);

        build(this.logger);
    }

    permlevel = (message: Message): number => {
        let permlvl = 0;

        const permOrder = this.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

        while (permOrder.length) {
            const currentLevel = permOrder.shift();

            if(!currentLevel) {
                continue;
            }

            if (message.guild && currentLevel.guildOnly) continue;
            if (currentLevel.check(message)) {
                permlvl = currentLevel.level;
                break;
            }
        }

        return permlvl;
    };

    awaitReply = async (msg: Message, question: string | Embed, limit = 60000, isDm = false, checkBot = false): Promise<string | false> => {
        const filter = (m: Message): boolean => {
            if(!checkBot) {
                return m.author.id === msg.author.id;
            }

            return m.author.id === msg.author.id || m.author.id === (this.user && this.user.id);
        };

        const sended = await (isDm ? msg.author : msg.channel).send(question);

        try {
            const collected = await sended.channel.awaitMessages(filter, { max: 1, time: limit, errors: ['time'] });
            const first = collected.first();

            if(!first) {
                return false;
            }

            if(checkBot && first.author.id === (this.user && this.user.id)) {
                return 'BOT_INTERRUPT';
            }

            return first.content.trim();
        } catch (e) {
            return false;
        }
    };

    clean = (text: string): string => {
        return clean(text)
            .replace(this.config.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0');
    };

    loadCommand = async ({ name, aliases }: { name: string; aliases: string[] }): Promise<false | string> => {
        try {
            const props = await import(`../commands/${name}`);

            if(!props.conf.enabled) {
                return false;
            }

            this.commands.set(name, props);

            aliases.forEach(alias => this.aliases.set(alias, name));

            return false;
        } catch (e) {
            const errorMsg = e.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');

            return `Can't load command ${name}: ${errorMsg}`;
        }
    };

    getUser = async (ownerId: string): Promise<{
        settings: Settings & { prefix: string }; //TODO
        subscriptions: Record<string, string[]>;
        languages: string[];
    }> => {
        const defaults = { prefix: '-' };

        const {
            data:
            {
                settings,
                subscriptions,
                languages
            }
        } = await this.request('/user?id=' + ownerId, null, '1.0');

        return { settings: { ...defaults, ...settings }, subscriptions, languages };
    };

    getPrefix = (ownerId: string): string => {
        const prefixes = this.prefixes;
        const prefix = this.config.defaultSettings.prefix;

        if (prefixes.has(ownerId)) {
            return prefixes.get(ownerId) || prefix;
        }

        return prefix;
    };

    request = async (
        options: (AxiosRequestConfig & { cache?: boolean }) | string,
        channel: TextChannel | DMChannel | null,
        version: string,
        tries = 1
    ): Promise<RequestInfo> => {
        const query = '&project=assistant&token=' + this.config.back;
        const url = this.config.core + (typeof options === 'string' ? options : options.url) + query;

        const headers = { 'Accept-Version': version };

        const settings = typeof options === 'string' ? { url, headers } : {
            ...options,
            headers: { ...(options.headers || {}), ...headers },
            url
        };

        const cleanUrl = decodeURI(settings.url.replace(this.config.back, 'TRUSTED'));

        if (tries > LIMIT_REPEAT_GET) {
            throw new ClientError(`Number of attempts to get "${cleanUrl}" exceeded`);
        }

        const [, id] = /id=(\d+)/.exec(url) || [null, '0'];
        const prefix = this.getPrefix(id || '0');

        return axios.request(settings)
            .then(({ data }) => data)
            .catch(async err => {
                const data = (err.response ? (err.response.data || {}) : {}) as { error: string; message: string };

                if (err.response && err.response.status === 406 && channel) {
                    throw new ClientError(data.error, data.message.render({ prefix }), channel);
                }

                this.logger.error(
                    'ClientError',
                    `[${tries} try] Error at client.request "${cleanUrl}": ${err.stack || err.message}`
                );

                await this.wait(1000);

                return this.request(options, channel, version, ++tries);
            });
    };

    generateLevelCache(): void {
        this.levelCache = this.config.permLevels
            .reduce((cache, { name, level }) => ({ ...cache, [name]: level }), {});
    }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RenderObject = Record<string, Record<string, string>> | Record<string, any>;

declare global {
    class Assistant extends AssistantBase { }

    interface Number {
        pluralize(variants: string[], lang: string): string;
    }

    interface Array<T> {
        random(): T;
    }

    interface String {
        render(options: RenderObject): string;
        capitalize(): string;
        toLowerFirst(): string;
    }

    interface Object {
        render(options: RenderObject): RenderObject | string;
    }
}

export { AssistantBase as Assistant };
