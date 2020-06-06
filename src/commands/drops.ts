// Команда "ЯЩИКИ" выводит информацию о текущих или ближайших ящиках уробороса.

import { Message } from 'discord.js';

import { AssistantMessage, RequestInfo, Configuration } from '../types';

import * as drops from '../helpers/drops';

async function run (
    _: Assistant,
    { channel }: AssistantMessage,
    info: RequestInfo
): Promise<Message> {
    const embed = drops.embedMany(info);

    return channel.send(embed);
}

const conf: Configuration = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'User',
    path: '/drops'
};

export { run, conf };
