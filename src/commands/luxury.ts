// Команда "РОСКОШЬ" выводит информацию о последних товарах Занила Терана в Хладной Гавани.
// Всю информацию берёт с сайта: http://benevolentbowd.ca/.

import { AssistantMessage, RequestInfo, Configuration } from '../types';
import { Message } from 'discord.js';

import * as luxury from '../helpers/luxury';

const run = async (
    _: Assistant,
    { channel, settings }: AssistantMessage,
    info: RequestInfo
): Promise<Message> => {
    const embed = luxury.embed(info, settings);

    return channel.send(embed);
};

const conf: Configuration = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'User',
    path: '/luxury'
};

export { run, conf };