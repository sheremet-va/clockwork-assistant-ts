// Команда "ПРЕФИКС" позволяет изменять префикс бота в ЛС или на сервере.

import { Embed } from '../helpers/embed';

import { ClientError } from '../modules/error';
import * as prefixes from '../modules/prefixes';
import { Message } from 'discord.js';
import { AssistantMessage, RequestInfo } from '../types';

const run = async (
    client: Assistant,
    { id, channel }: AssistantMessage,
    _: RequestInfo,
    [prefix = '']
): Promise<Message> => {
    const { prefix: oldPrefix } = client.prefixes[id] || client.config.defaultSettings;
    const path = `/translations/settings/prefix?id=${id}&value=${prefix},${oldPrefix}`;

    const { translations: { success } } = await client.request(path, channel, '1.0');

    const result = prefixes.append(client, { id, prefix });

    if (!result) {
        throw new ClientError(`Unknown Error. Please, contact <@!?${client.config.ownerID}>.`, '', channel);
    }

    const embed = new Embed({
        color: 'success',
        description: Embed.emojis.success + success.render({ prefix })
    });

    return channel.send(embed);
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'Moderator'
};

export { run, conf };