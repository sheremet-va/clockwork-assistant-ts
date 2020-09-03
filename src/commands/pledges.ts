// Команда "ОБЕТЫ" присылает текущие и завтрашние обеты на языке, выбранным в ЛС
// или настроенном на сервере. Также принимает аргумент в ввиде числа (количество
// дней, через которые наступит обет) — в таком случае пришлёт обеты этого дня.

import { Embed } from '../helpers/embed';

import * as pledges from '../helpers/pledges';
import { AssistantMessage } from '../types';
import { Message } from 'discord.js';

const run = async (
    client: Assistant,
    { channel, ownerId: id, command, settings }: AssistantMessage,
    info: { data: Record<string, string> },
    [days = '0']
): Promise<Message | undefined> => {
    const path = `/pledges/${days}?id=${id}`;
    const tPath = '/pledges/1?id=' + id;

    const { translations, data } = await client.request(path, channel, '1.0');

    const tomorrow = `${days}` === '0'
        ? await client.request(tPath, null, '1.0')
        : null;

    const title = pledges.title(days, translations);

    const embed = new Embed({
        author: title,
        thumbnail: command === 'обеды' ? 'undauntedEgg' : 'undaunted'
    });

    const result = pledges.embed(
        embed,
        settings,
        tomorrow,
        { translations, data }
    );

    return channel.send(result);
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'User'
};

export { run, conf };