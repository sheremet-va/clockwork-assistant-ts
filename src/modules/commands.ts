import * as fs from 'fs';
import * as Path from 'path';

import { Command } from '../types';

const path = Path.resolve(__dirname, '../configs', 'commands.json');

function read(): Command[] {
    try {
        const file = fs.readFileSync(path, 'utf8');
        const commands = JSON.parse(file);

        return commands;
    } catch(err) {
        return [];
    }
}

function clean(): void {
    fs.writeFileSync(path, JSON.stringify([]));
}

async function get(client: Assistant): Promise<Command[]> {
    const existing = read();

    if(existing.length) {
        return existing;
    }

    const request = await client.request('/commands?id=333', null, '1.0');
    const commands = request.data.commands;

    fs.writeFileSync(path, JSON.stringify(commands));

    return commands;
}

export { get, clean };