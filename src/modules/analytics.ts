import * as fs from 'fs';
import * as Path from 'path';

const path = Path.resolve(__dirname, '../configs', 'analytics.json');

function read(): Record<string, number> {
    const file = fs.readFileSync(path, 'utf8');
    const settings = JSON.parse(file);

    return settings;
}

function add(url: string): boolean {
    const analytics = read();

    const existing = analytics[url] || 0;

    analytics[url] = existing + 1;

    const result = JSON.stringify(analytics);

    try {
        fs.writeFileSync(path, result);

        return true;
    } catch (err) {
        console.error(err.message);

        return false;
    }
}

export { read, add };