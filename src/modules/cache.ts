// DISABLED

import Enmap from 'enmap';

const cache = new Enmap('cache');

function get<T>(url: string): T {
    return cache.get(url);
}

function set(url: string, value: any): void {
    cache.set(url, value);
}

function remove(url: string): void {
    cache.delete(url);
}


export { get, set, remove };