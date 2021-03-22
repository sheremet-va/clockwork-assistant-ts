// Команда "ПРЕФИКС" позволяет изменять префикс бота в ЛС или на сервере.

import { Embed, EmbedColor, Emoji } from '../helpers/embed';

import { Message } from 'discord.js';
import { AssistantMessage, RequestInfo } from '../types';

import { setPrefix } from '../modules/prefixes';

const run = async (
    client: Assistant,
    { ownerId: id, channel }: AssistantMessage,
    _: RequestInfo,
    [prefix = '']
): Promise<Message> => {
    const oldPrefix = client.getPrefix(id);
    const path = `/translations/settings/prefix?id=${id}&value=${prefix},${oldPrefix}`;

    const { translations: { success } } = await client.request(path, channel, '1.0');

    await setPrefix(id, prefix);

    const embed = new Embed({
        color: EmbedColor.Drops,
        description: Emoji.Success + success.render({ prefix })
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