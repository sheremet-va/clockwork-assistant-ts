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

export {
    guildCreate,
    guildDelete
};
