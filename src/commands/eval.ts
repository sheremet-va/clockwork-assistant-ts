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
        const result = args[0] === 'request'
            ? await client.request(args[1], null, '1.0')
            : eval(code);

        const evaled = JSON.stringify(result, null, 4);

        const clean = client.clean(evaled);
        return channel.send(`\`\`\`js\n${clean}\n\`\`\``);
    } catch (err) {
        return channel.send(`\`ERROR\` \`\`\`xl\n${client.clean(err.message)}\n\`\`\``);
    }
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: false,
    permLevel: 'Bot Owner'
};

export { run, conf };
