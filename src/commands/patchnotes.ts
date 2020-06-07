// Команда "ОБНОВЛЕНИЕ" выводит описание последнего вышедшего обновления для лайв-версии игры.

import { AssistantMessage } from '../types';
import { Message } from 'discord.js';

import * as patch from '../helpers/patch';

const run = async (
    _: Assistant,
    { channel, settings }: AssistantMessage,
    info: { data: patch.DataCommand }
): Promise<Message> => {
    const embed = patch.embed(info, settings.language);

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