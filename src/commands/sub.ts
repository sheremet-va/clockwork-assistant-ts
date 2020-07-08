// Команда "ПОДПИСАТЬСЯ" позволяет подпсисаться на определённую рассылку.
// В аргументе название подписки. Если его нет, то выводит все доступные подписки.

import * as subscriptions from '../helpers/subscriptions';

import { Message, TextChannel } from 'discord.js';

import { AssistantMessage, RequestInfo } from '../types';
import { subscribed } from '../modules/analytics';

const run = async (
    client: Assistant,
    { channel, id, guild }: AssistantMessage,
    _: RequestInfo,
    [name]: [string | undefined]
): Promise<string | Message> => { // eslint-disable-line no-unused-vars
    if(!name) {
        // TODO show all subs
        return 'subs';
    }

    const textChannel = channel as TextChannel;

    const embed = await subscriptions.embed(client, { channel: textChannel, id }, name, 'sub');

    subscribed(name, { channelId: channel.id, guildId: ({ id: null } || guild).id });

    return channel.send(embed);
};

const conf = {
    enabled: true,
    guildOnly: true,
    helpShown: true,
    permLevel: 'Administrator'
};

export { run, conf };