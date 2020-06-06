// Команда "ОБНОВЛЕНИЕ" выводит описание последнего вышедшего обновления для лайв-версии игры.

import { AssistantMessage } from '../types';
import { Message } from 'discord.js';

import * as patch from '../helpers/patch';

const run = async (
    _: Assistant,
    { channel }: AssistantMessage,
    info: { data: Record<string, string> }
): Promise<Message> => {
    const embed = patch.embed(info);

    return channel.send(embed);
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    path: '/patch-notes',
    permLevel: 'User'
};

export { run, conf };