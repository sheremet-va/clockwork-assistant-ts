// Команда "TIMEZONE" позволяет менять часовой пояс сервера

import { Message } from 'discord.js';

import { AssistantMessage, RequestInfo } from '../types';

import * as settings from '../helpers/settings';

async function run(
    client: Assistant,
    { channel, id }: AssistantMessage,
    _info: RequestInfo,
    [value = '']
): Promise<Message | false> {

    if(!value) {
        return false;
    }

    const embed = await settings.embed(
        { client, channel },
        { type: 'timezone', value, id }
    );

    return channel.send(embed);
}

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'Moderator'
};

export { run, conf };
