// Команда "СТАТУС" присылает состояние всех серверов или сервера, указанного в аргументе.

import {
    embed,
    Status,
    Statuses,
    Platform,
    Render,
    TranslationsCommand,
    DataCommand
} from '../helpers/status';

import { AssistantMessage } from '../types';
import { Message } from 'discord.js';

const aliases = {
    eu: ['еу', 'европа', 'europe'],
    na: ['на', 'america', 'америка'],
    ps_eu: ['пс_еу', 'ps eu', 'пс еу'],
    ps_us: ['пс_на', 'ps_na', 'ps na', 'ps us', 'пс на'],
    pts: ['птс'],
    xbox_eu: ['хбох еу', 'хбох_еу', 'иксбокс еу', 'иксбокс_еу'],
    xbox_us: ['хбох на', 'хбох_на', 'иксбокс на', 'иксбокс_на', 'xbox_na', 'xbox na']
};

type Group = {
    aliases: string[];
    servers: (keyof Statuses)[];
    maintenance: string;
}

const groups: Record<Platform, Group> = {
    pc: {
        aliases: ['пк'],
        servers: ['eu', 'na', 'pts'],
        maintenance: 'pc'
    },
    ps: {
        aliases: ['пс', 'плейстейшн', 'ps4', 'PS4', 'PlayStation'],
        servers: ['ps_eu', 'ps_us'],
        maintenance: 'ps'
    },
    xbox: {
        aliases: ['хбох', 'иксбокс'],
        servers: ['xbox_eu', 'xbox_us'],
        maintenance: 'xbox'
    }
};

function findGroup(regServer: RegExp): (typeof groups)[Platform] | undefined {
    const [, group] = Object.entries(groups)
        .find(([key, group]) => regServer.test(key) || group.aliases.some(alias => regServer.test(alias))) || [];

    return group;
}

type Maintenance = Record<Platform, Render>;

function buildMaintence(
    maintenance: Maintenance,
    group: Group
): Maintenance {
    return Object.entries(maintenance)
        .filter(([region]) => group.maintenance === region)
        .reduce((total, [region, value]) => ({ ...total, [region]: value }), {} as Maintenance);
}

type Translations = Record<keyof TranslationsCommand, string>;

// eslint-disable-next-line no-unused-vars
const run = async (
    client: Assistant,
    { channel, settings, guild }: AssistantMessage,
    info: { translations: Translations; data: DataCommand }, // TODO
    args: string[]
): Promise<Message | false> => {
    if(!args.length) {
        const message = await embed({ client, ...info }, settings, (guild || { id: '0' }).id);

        return channel.send(message);
    }

    const userServer = args.join(' ');
    const regServer = new RegExp(userServer, 'i');

    const group = findGroup(regServer);

    if(group) {
        const servers = group.servers.reduce((total, name) =>
            ({ ...total, [name]: info.data[name] }), {}) as Record<keyof Statuses, Status>;

        const maintenance = buildMaintence(info.data.maintenance, group);

        const message = await embed(
            {
                client,
                ...info,
                data: { ...servers, maintenance }
            },
            settings,
            (guild || { id: '0' }).id // апи охуэет
        );

        return channel.send(message);
    }

    const serverEntry = Object.entries(aliases)
        .find(([key, aliases]) =>
            regServer.test(key) || aliases.some(alias => regServer.test(alias))
        ) as [keyof Statuses, string[]];

    if(!serverEntry) {
        return false;
    }

    const server = serverEntry[0];

    if(!server) {
        return false;
    }

    const foundGroup = Object.entries(groups)
        .find(([, value]) => value.servers.includes(server));

    if(!foundGroup) {
        return false;
    }

    const [, serverGroup] = foundGroup;

    const maintenance = buildMaintence(info.data.maintenance, serverGroup);

    const message = await embed(
        {
            client,
            ...info,
            data: {
                [server]: info.data[server],
                maintenance
            }
        },
        settings,
        (guild || { id: '0' }).id
    );

    return channel.send(message);
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'User',
    path: '/status'
};

export { run, conf };
