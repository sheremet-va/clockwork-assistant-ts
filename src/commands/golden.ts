// Команда "ЗОЛОТАЯ" выводит информацию о последних товарах Адазаби Золотой в Сиродиле.
// Всю информацию берёт с сайта: http://benevolentbowd.ca/.

import { AssistantMessage, RequestInfo, Configuration } from '../types';
import { Message } from 'discord.js';

import * as golden from '../helpers/golden';

const run = async (
    _: Assistant,
    { channel, settings }: AssistantMessage,
    info: RequestInfo
): Promise<Message> => {
    const embed = golden.embed(info, settings);

    return channel.send(embed);
};

const conf: Configuration = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'User',
    path: '/golden'
};

export { run, conf };