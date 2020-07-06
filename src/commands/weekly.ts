// Команда "ИСПЫТАНИЯ" присылает текущие еженедельные испытания.
// Всю информацию берёт со страницы: https://esoleaderboards.com/trial/weekly.

import * as weekly from '../helpers/weekly';

import { Message } from 'discord.js';

import { AssistantMessage, RequestInfo } from '../types';
import { Complete } from '../helpers/utils';

const run = async (
    _: Assistant,
    { settings, channel }: AssistantMessage,
    info: RequestInfo
): Promise<Message> => {
    const embed = weekly.embed(info as Complete<RequestInfo>, settings);

    return channel.send(embed);
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    path: '/weekly',
    permLevel: 'User'
};

export { run, conf };
