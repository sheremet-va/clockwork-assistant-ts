import { MessageEmbed, TextChannel } from 'discord.js';
import { AssistantMessage } from '../types';

import moment from 'moment';

const colors = {
    log: 0xB2D5FF,
    error: 0xFF8E8E,
    cmd: 0xB2D5FF
};

export class Logger {
    constructor(private client: Assistant) {}

    private async write(content: string, type: keyof typeof colors = 'log'): Promise<void> {
        const isTest = this.client.user ? this.client.user.id === '545503135200968708' : true;
        const channel = this.client.channels.cache.get('585174236398616577') as TextChannel;

        const timestamp = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]:`;
        const message = `${timestamp} (${type.toUpperCase()}) ${content}`;

        console.log(message);

        if (isTest) {
            return;
        }

        const embed = this.embed(type, content);

        channel.send(embed);
    }

    private embed(type: keyof typeof colors, content: string): MessageEmbed {
        return new MessageEmbed()
            .setColor(colors[type] || 0xB2D5FF)
            .setDescription(`[${type.toUpperCase()}] ${content.substr(0, 1990)}`)
            .setTimestamp();
    }

    log = (...args: string[]): Promise<void> => this.write(args.join(' '), 'log');
    error = (type: string, message: string, stack?: string): Promise<void> => {
        this.client.request({
            method: 'POST' as const,
            url: '/logs/error?id=333',
            data: {
                message,
                type,
                stack,
                date: new Date().valueOf()
            },
            headers: {
                'Content-Type': 'application/json',
            }
        }, null, '1.0.0').catch(console.error);

        return this.write(`${type}: ${message}`, 'error');
    };
    cmd = (description: string, message: AssistantMessage): Promise<void> => {
        this.client.request({
            method: 'POST' as const,
            url: '/logs/command?id=333',
            data: {
                guildId: ({ id: null } || message.guild).id,
                authorId: message.author.id,
                command: message.command,
                arguments: message.args,
                ts: message.createdTimestamp
            },
            headers: {
                'Content-Type': 'application/json',
            }
        }, null, '1.0.0').catch(console.error);

        return this.write(description, 'cmd');
    };
}
