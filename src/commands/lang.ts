// Команда "ЯЗЫК" позволяет менять то, как отображаются обеты. Возможно, в будущем
// расширается на другие команды, поэтому использует аргументы.

import * as settings from '../helpers/settings';

import { Message } from 'discord.js';
import { AssistantMessage, RequestInfo } from '../types';

const run = async (
    client: Assistant,
    { ownerId: id, channel, languages }: AssistantMessage,
    _: RequestInfo,
    [type = '', value = '']
): Promise<Message | false> => {
    if(!type) {
        return false;
    }

    if(!value && languages.includes(type)) {
        value = type;
        type = 'language';
    }

    const embed = await settings.embed(
        { client, channel },
        { type, value, id }
    );

    return channel.send(embed);
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'Moderator'
};

export { run, conf };