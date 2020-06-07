import * as fs from 'fs';
import * as Path from 'path';

const path = Path.resolve(__dirname, '../configs', 'prefixes.json');

function read(): Record<string, Record<'prefix', string>> {
    const file = fs.readFileSync(path, 'utf8');
    const settings = JSON.parse(file);

    return settings;
}

function append(
    client: Assistant,
    { id, prefix }: { id: string; prefix: string }
): boolean {
    const config = client.prefixes[id] || {};

    config.prefix = prefix;

    const result = JSON.stringify({
        ...client.prefixes,
        [id]: config
    });

    try {
        fs.writeFileSync(path, result);

        return true;
    } catch (err) {
        client.logger.error(err.message);

        return false;
    }
}

export { read, append };