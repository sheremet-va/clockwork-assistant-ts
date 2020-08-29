import { Embed } from '../helpers/embed';

import { TextChannel, DMChannel } from 'discord.js';
import { AssistantUser } from '../types';

class ErrorEmbed extends Embed {
    constructor(message: string) {
        super({
            color: 'error',
            description: Embed.emojis.error + message
        });
    }
}

class ClientError extends Error {
    result = 'error';
    name = 'ClientError';

    constructor(
        public description: string,
        public message: string = '',
        public channel: TextChannel | DMChannel | AssistantUser | null = null
    ) {
        super(message);
    }
}

export { ErrorEmbed, ClientError };