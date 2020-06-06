import { AssistantMessage } from '../types';

const run = async (
    client: Assistant,
    { channel, createdTimestamp }: AssistantMessage
): Promise<void> => {
    const msg = await channel.send('Ping?');

    msg.edit(
        `Pong! Latency is ${msg.createdTimestamp - createdTimestamp}ms. API latency is ${Math.round(client.ws.ping)}ms`
    );
};

const conf = {
    enabled: true,
    guildOnly: false,
    helpShown: false,
    permLevel: 'Bot Support'
};

export { run, conf };