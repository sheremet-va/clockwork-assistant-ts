// Команда "ОТПИСАТЬСЯ" позволяет отписаться от на определённой рассылки.

import { Message, TextChannel } from 'discord.js';

import { AssistantMessage, RequestInfo } from '../types';

import * as subscriptions from '../helpers/subscriptions';
import { unsubscribed } from '../modules/analytics';

async function run(
    client: Assistant,
    { channel, id, guild }: AssistantMessage,
    _info: RequestInfo,
    [name = '']
): Promise<Message | false> {

    if(!name) {
        return false;
    }

    const embed = await subscriptions.embed(
        client,
        { channel: channel as TextChannel, id },
        name,
        'unsub'
    );

    unsubscribed(name, { channelId: channel.id, guildId: ({ id: null } || guild).id });

    return channel.send(embed);
}

const conf = {
    enabled: true,
    guildOnly: true,
    helpShown: true,
    permLevel: 'Administrator'
};

export { run, conf };