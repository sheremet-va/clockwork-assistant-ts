import Enmap from 'enmap';

type Target = {
    guildId: string | null;
    channelId: string;
}

const analytics = new Enmap('analytics');

function ensure(type: string, action: object = {}): void {
    const entry = {
        date: new Date().valueOf(),
        type,
        ...action
    };

    analytics.ensure(analytics.autonum, entry);
}

function guildCreate(guildId: string): void {
    ensure('guildCreate', { guildId });
}

function guildDelete(guildId: string): void {
    ensure('guildDelete', { guildId });
}

function subscribed(name: string, target: Target): void {
    ensure('subscribed', { ...target, name });
}

function unsubscribed(name: string, target: Target): void {
    ensure('unsubscribed', { ...target, name });
}

export {
    guildCreate,
    guildDelete,
    subscribed,
    unsubscribed
};
