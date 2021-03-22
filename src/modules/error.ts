import { Embed, EmbedColor, Emoji } from '../helpers/embed';

import { TextChannel, DMChannel, NewsChannel } from 'discord.js';
import { AssistantUser } from '../types';

class ErrorEmbed extends Embed {
    constructor(message: string) {
        super({
            color: EmbedColor.Error,
            description: Emoji.Error + message
        });
    }
}

class ClientError extends Error {
    public name = 'ClientError';

    constructor(
        public description: string,
        public message: string = '',
        public channel: TextChannel | DMChannel | NewsChannel | AssistantUser | null = null
    ) {
        super(message);
    }
}

export { ErrorEmbed, ClientError };