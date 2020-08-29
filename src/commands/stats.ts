// Команда "СТАТЫ" присылает статистику по боту.

import { version, Message } from 'discord.js';
import { AssistantMessage } from '../types';

import moment from 'moment';
import 'moment-duration-format';

const run = async (
    client: Assistant,
    message: AssistantMessage,
): Promise<Message> => {
    const duration = moment.duration(client.uptime || 0).format(' D [дн.], H [ч.], m [мин.], s [сек.]');

    return message.channel.send(`= СТАТИСТИКА =
• Исп. памяти   :: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Время работы  :: ${duration}
• Пользователей :: ${client.users.cache.size.toLocaleString()}
• Серверов      :: ${client.guilds.cache.size.toLocaleString()}
• Каналов       :: ${client.channels.cache.size.toLocaleString()}
• Discord.js    :: v${version}
• Node          :: ${process.version}`, {code: 'asciidoc'});
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: false,
    permLevel: 'Bot Support'
};

export { run, conf };