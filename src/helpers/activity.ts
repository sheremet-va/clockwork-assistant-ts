import { Presence } from 'discord.js';

const FREQUENCY_IN_MS = 1000 * 60 * 3;

function random(client: Assistant): void {
    const statuses = [
        `Helping ${client.guilds.cache.size} servers!`,
        `DM me ${client.config.defaultSettings.prefix}help`,
        'Cyrodiil with lags.',
        'Russian Roulette.',
        ` ${client.config.defaultSettings.prefix}drops`
    ];

    const change = (): Promise<Presence> | null => client.user && client.user.setActivity(statuses.random(), { type: 'PLAYING' });

    change();

    setInterval(change, FREQUENCY_IN_MS);
}

export { random };