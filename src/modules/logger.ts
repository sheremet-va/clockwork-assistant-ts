import { MessageEmbed, TextChannel } from 'discord.js';

import { promisify } from 'util';
import * as moment from 'moment';

import * as fs from 'fs';
import * as Path from 'path';

const appendFile = promisify(fs.appendFile);
const writeFile = promisify(fs.writeFile);

const colors = {
    log: 0xB2D5FF,
    warn: 0xFFF7B2,
    error: 0xFF8E8E,
    debug: 0xD2FF8E
};

export class Logger {
    client: Assistant;

    constructor(assistant: Assistant) {
        this.client = assistant;
    }

    private async write(content: string, type = 'log'): Promise<void> {
        const isTest = this.client.user ? this.client.user.id === '545503135200968708' : true;
        const channel = this.client.channels.cache.get('585174236398616577') as TextChannel;

        const timestamp = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]:`;
        const day = `${moment().format('YYYY-MM-DD')}`;
        const path = Path.resolve(__dirname, `../logs/${day}-logs.txt`);
        const message = `${timestamp} (${type.toUpperCase()}) ${content}`;

        try {
            await appendFile(path, message + '\n');
        }
        catch (e) {
            await writeFile(path, message + '\n')
                .catch(console.error);
        }

        console.log(message);

        if (isTest) {
            return;
        }

        const embed = this.embed(type, content);

        channel.send(embed);
    }

    private embed(type: string, content: string): MessageEmbed {
        return new MessageEmbed()
            .setColor(colors[type as keyof typeof colors] || 0xB2D5FF)
            .setDescription(`[${type.toUpperCase()}] ${content.substr(0, 1990)}`)
            .setTimestamp();
    }

    log = (...args: string[]): Promise<void> => this.write(args.join(' '), 'log');
    error = (...args: string[]): Promise<void> => this.write(args.join(' '), 'error');
    warn = (...args: string[]): Promise<void> => this.write(args.join(' '), 'warn');
    debug = (...args: string[]): Promise<void> => this.write(args.join(' '), 'debug');
    cmd = (...args: string[]): Promise<void> => this.write(args.join(' '), 'cmd');
}
