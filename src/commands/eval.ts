// Команда EVAL выполняет **ЛЮБОЙ** код javascript, который получает.
// ДЛЯ ЭТОЙ КОМАНДЫ ТРЕБУЕТ 10 УРОВЕНЬ ДОСТУПА НЕ ПРОСТО ТАК! Эта команда
// имеет доступ к **любому** файлу на компьютере — с ее помощью можно как
// украсть какую-то информацию, так и снести весь диск.

import { Message } from 'discord.js';

import { AssistantMessage, RequestInfo } from '../types';

const run = async (
    client: Assistant,
    { channel }: AssistantMessage,
    _info: RequestInfo,
    args: string[]
): Promise<Message> => { // eslint-disable-line no-unused-vars
    const code = args.join(' ');

    try {
        const evaled = eval(code);
        const clean = client.clean(evaled);
        return channel.send(`\`\`\`js\n${clean}\n\`\`\``);
    } catch (err) {
        return channel.send(`\`ERROR\` \`\`\`xl\n${client.clean(err)}\n\`\`\``);
    }
};

const conf = {
    enabled: false,
    guildOnly: false,
    helpShown: false,
    permLevel: 'Bot Owner'
};

export { run, conf };
