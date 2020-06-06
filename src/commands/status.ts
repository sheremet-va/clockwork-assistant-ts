// Команда "СТАТУС" присылает состояние всех серверов или сервера, указанного в аргументе.

import * as status from '../helpers/status';
import { AssistantMessage, RequestInfo } from '../types';
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

const groups = {
    pc: {
        aliases: ['пк'],
        servers: ['eu', 'na', 'pts'],
        maintence: 'PC/Mac'
    },
    ps: {
        aliases: ['пс', 'плейстейшн'],
        servers: ['ps_eu', 'ps_us'],
        maintence: 'PlayStation'
    },
    xbox: {
        aliases: ['хбох', 'иксбокс'],
        servers: ['xbox_eu', 'xbox_us'],
        maintence: 'Xbox One'
    }
};

function findGroup(regServer: RegExp) {
    const [, group] = Object.entries(groups)
        .find(([key, group]) => regServer.test(key) || group.aliases.some(alias => regServer.test(alias))) || [];

    return group;
}

function buildMaintence(info, group) {
    return Object.entries(info.data.maintence)
        .filter(([region]) => group.maintence === region)
        .reduce((total, [region, value]) => ({ ...total, [region]: value }), {});
}

// eslint-disable-next-line no-unused-vars
const run = async (
    client: Assistant,
    { channel, settings, guild }: AssistantMessage,
    info: { translations: any; data: any }, // TODO
    args: string[]
): Promise<Message | false> => {
    if(!args.length) {
        const embed = await status.embed({ client, ...info }, settings, guild.id);

        return channel.send(embed);
    }

    const userServer = args.join(' ');
    const regServer = new RegExp(userServer, 'i');

    const group = findGroup(regServer);

    if(group) {
        const servers = group.servers.reduce((total, name) =>
            ({ ...total, [name]: info.data[name] }), {}) as { en: 'UP' | 'DOWN' };

        const maintence = buildMaintence(info, group);

        const embed = await status.embed(
            {
                client,
                ...info,
                data: { ...servers, maintence }
            },
            settings,
            guild?.id || '' // апи охуэет
        );

        return channel.send(embed);
    }

    const [server] = Object.entries(aliases)
        .find(([key, aliases]) => regServer.test(key) || aliases.some(alias => regServer.test(alias))) || [];

    if(!server) {
        return false;
    }

    const foundGroup = Object.entries(groups)
        .find(([, value]) => value.servers.includes(server));

    if(!foundGroup) {
        return false;
    }

    const [, serverGroup] = foundGroup;

    const maintence = buildMaintence(info, serverGroup);

    const embed = await status.embed(
        {
            ...info,
            data: {
                [server]: info.data[server],
                maintence
            }
        }
    );

    return channel.send(embed);
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'User',
    path: '/status'
};

export { run, conf };

