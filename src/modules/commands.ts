import { Command } from '../types';

async function get(client: Assistant): Promise<Command[]> {
    const request = await client.request('/commands?id=333', null, '1.0');
    return request.data.commands;
}

export { get };