import { MessageEmbed, TextChannel } from 'discord.js';
import { AssistantMessage } from '../types';

import moment from 'moment';
import Enmap from 'enmap';

const colors = {
    log: 0xB2D5FF,
    error: 0xFF8E8E,
    cmd: 0xD2FF8E
};

const errors = new Enmap('logs_errors');
const commands = new Enmap('logs_commands');

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
    error = (...args: string[]): Promise<void> => {
        const message = args.join(' ');

        errors.set(errors.autonum, {
            message,
            date: new Date().valueOf()
        });

        return this.write(args.join(' '), 'error');
    };
    cmd = (description: string, message: AssistantMessage): Promise<void> => {
        commands.set(commands.autonum, {
            guildId: ({ id: null } || message.guild).id,
            authorId: message.author.id,
            command: message.command,
            arguments: message.args,
            date: message.createdTimestamp
        });

        return this.write(description, 'cmd');
    };
}
