import { Embed } from '../helpers/embed';

import { TextChannel, DMChannel } from 'discord.js';

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
        public channel: TextChannel | DMChannel | null = null
    ) {
        super(message);
    }
}

export { ErrorEmbed, ClientError };