import { AssistantMessage } from '../types';
import * as commands from '../modules/commands';

const run = async (
    _: Assistant,
    message: AssistantMessage
): Promise<never> => {// eslint-disable-line no-unused-vars
    await message.reply('бот выключается.');

    commands.clean();

    process.exit(1);
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: false,
    permLevel: 'Bot Admin'
};

export { run, conf };