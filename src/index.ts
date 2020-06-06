// Based on https://github.com/AnIdiotsGuide/guidebot

import { Assistant } from './modules/assistant';

import { promisify } from 'util';
import { readdir as readSync } from 'fs';

import { notUndefined } from './helpers/utils';
import { Command } from './types';

import * as Subscriptions from './services/subscriptions';

const readdir = promisify(readSync);

const client = new Assistant();

const init = async (): Promise<void> => {
    const { data: { commands } } = await client.request('/commands?id=333', null, '1.0') as {
        data: { commands: Command[] };
    };

    client.logger.log(`Launching ${commands.length} commands.`);

    commands.forEach(command => {
        const response = client.loadCommand(command);

        if (response) {
            console.log(response);
        }
    });

    const evtFiles = await readdir('./events/'); // todo Path.resolve

    client.logger.log(`Launching ${evtFiles.length} events.`);

    evtFiles.forEach(async file => {
        const eventName = file.split('.')[0];

        const event = await import(`./events/${file}`);

        client.on(eventName, event.default.bind(null, client));
    });

    client.generateLevelCache();

    const subscriptionNames = await readdir('./subscriptions/');

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
            client.logger.error(err);

            process.exit(1);
        });

    Subscriptions.init(client, subscriptions);

    client.login(client.config.token);
};

init();
