import { MessageEmbed, TextChannel } from 'discord.js';
import { AssistantMessage } from '../types';

import { promisify } from 'util';
import moment from 'moment';

import * as fs from 'fs';
import * as Path from 'path';

const appendFile = promisify(fs.appendFile);
const writeFile = promisify(fs.writeFile);

const colors = {
    log: 0xB2D5FF,
    error: 0xFF8E8E,
    cmd: 0xB2D5FF,
    req: 0xB2D5FF
};

export class Logger {
    constructor(private client: Assistant) {}

    private async write(content: string, type: keyof typeof colors = 'log', cmdEmbed: MessageEmbed | null = null): Promise<void> {
        const isTest = this.client.user ? this.client.user.id === '545503135200968708' : true;
        const channel = this.client.channels.cache.get('585174236398616577') as TextChannel;

        const timestamp = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]:`;
        const message = `${timestamp} (${type.toUpperCase()}) ${content}`;

        console.log(message);

        if(type === 'log') {
            const day = `${moment().format('YYYY-MM-DD')}`;
            const path = Path.resolve(__dirname, `../logs/${day}-logs.txt`);

            try {
                await appendFile(path, message + '\n');
            }
            catch (e) {
                await writeFile(path, message + '\n')
                    .catch(console.error);
            }
        }

        if (isTest || message.includes('REQ')) {
            return;
        }

        const embed = cmdEmbed || this.embed(type, content);

        channel?.send(embed);
    }

    private embed(type: keyof typeof colors, content: string): MessageEmbed {
        return new MessageEmbed()
            .setColor(colors[type] || 0xB2D5FF)
            .setDescription(`[${type.toUpperCase()}] ${content.substr(0, 1990)}`)
            .setTimestamp();
    }

    log = (...args: string[]): Promise<void> => this.write(args.join(' '), 'log');
    error = (type: string, message: string, stack?: string): void => {
        this.write(`${type}: ${message + (stack || '')}`, 'error');

        if(type === 'ClientError') {
            return;
        }

        this.client.request({
            method: 'POST' as const,
            url: '/logs/error?id=333',
            data: {
                message: message.split('\n')[0] || message,
                type,
                stack,
                date: new Date().valueOf()
            },
            headers: {
                'Content-Type': 'application/json',
            }
        }, null, '1.0.0').catch(err => this.log(err.description || err.message));
    };
    cmd = (description: string, message: AssistantMessage): void => {
        const options = {
            guildId: (message.guild || { id: null }).id,
            authorId: message.author.id,
            channelId: message.channel.id,
            command: message.command,
            arguments: message.args,
            date: message.createdTimestamp
        };

        this.client.request({
            method: 'POST' as const,
            url: '/logs/command?id=333',
            data: options,
            headers: {
                'Content-Type': 'application/json',
            }
        }, null, '1.0.0').catch(err => this.log(err.description || err.message));

        const args = message.args.length ? ` с аргументами ${message.args.join(', ')}` : '';
        const channel = message.channel.type === 'dm' ? 'в DM' : `в канале «${message.channel.name}»`;

        const embed = new MessageEmbed()
            .setColor(0x96D5A9)
            .setDescription(`${message.author.permLevelName} запускает ${channel} команду «${message.command}»${args}.`)
            .setAuthor(message.author.tag, message.author.avatarURL() || '')
            .setFooter((message.guild || { name: 'DM' }).name, message?.guild?.iconURL() || '')
            .setTimestamp();

        this.write(description, 'cmd', embed);
    };
}
