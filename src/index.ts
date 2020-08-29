// Based on https://github.com/AnIdiotsGuide/guidebot

import { Assistant } from './modules/assistant';
import { get as getCommands } from './modules/commands';

import { readdir as readSync, existsSync, mkdirSync } from 'fs';
import { promisify } from 'util';
import * as Path from 'path';

import { notUndefined } from './helpers/utils';

import * as Subscriptions from './services/subscriptions';

const readdir = promisify(readSync);

const names = [
    'logs',
    'configs'
];

names.forEach(name => {
    const folderPath = `${__dirname}/${name}`;

    if (!existsSync(folderPath)){
        mkdirSync(folderPath);
    }
});

const client = new Assistant();

const init = async (): Promise<void> => {
    const commands = await getCommands(client);

    client.logger.log(`Launching ${commands.length} commands.`);

    const cmds = commands.map(async command => {
        const response = await client.loadCommand(command);

        if (response) {
            console.log(response);
        }
    });

    await Promise.all(cmds)
        .catch(console.error);

    const evtPath = Path.resolve(__dirname, 'events');
    const evtFiles = await readdir(evtPath);

    client.logger.log(`Launching ${evtFiles.length} events.`);

    evtFiles.forEach(async file => {
        const eventName = file.split('.')[0];

        const event = await import(`./events/${file}`);

        client.on(eventName, event.event.bind(null, client));
    });

    client.generateLevelCache();

    const subsPath = Path.resolve(__dirname, 'subscriptions');
    const subscriptionNames = await readdir(subsPath);

    client.logger.log(`Launching ${subscriptionNames.length} subscriptions.`);

    const subsPromises = subscriptionNames.map(async file => {
        if (!file.endsWith('.ts') && !file.endsWith('.js')) { // .js
            return;
        }

        const path = `./subscriptions/${file}`;
        const moduleName = file.replace(/\.ts|\.js/, '');
        const botModule = (await import(path)).default;
        const names = botModule.names || [moduleName];

        return {
            name: moduleName,
            controller: botModule,
            names
        };
    });

    const subscriptions = await Promise.all(subsPromises)
        .then(subs => subs.filter(notUndefined))
        .catch(err => {
            client.logger.error('ClientError', err.message, err.stack);

            process.exit(1);
        });

    Subscriptions.init(client, subscriptions);

    client.login(client.config.token);
};

init().catch(console.error);
