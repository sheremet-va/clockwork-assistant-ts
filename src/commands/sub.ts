// Команда "ПОДПИСАТЬСЯ" позволяет подпсисаться на определённую рассылку.
// В аргументе название подписки. Если его нет, то выводит все доступные подписки.

import * as subscriptions from '../helpers/subscriptions';

import { Message, TextChannel } from 'discord.js';
import { AssistantMessage, RequestInfo } from '../types';

const run = async (
    client: Assistant,
    { channel, id }: AssistantMessage,
    _: RequestInfo,
    [name]: [string | undefined]
): Promise<string | Message> => { // eslint-disable-line no-unused-vars
    if(!name) {
        return 'subs';
    }

    const textChannel = channel as TextChannel;

    const embed = await subscriptions.embed(client, { channel: textChannel, id }, name, 'sub');

    return channel.send(embed);
};

const conf = {
    enabled: true,
    guildOnly: true,
    helpShown: true,
    permLevel: 'Administrator'
};

export { run, conf };