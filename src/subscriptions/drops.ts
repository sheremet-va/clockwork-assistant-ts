import { Subscriptions, NotifyData, Settings } from '../modules/subscriptions';

import * as drops from '../helpers/drops';
import { Embed } from '../helpers/embed';

export default class extends Subscriptions {
    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'drops');
    }

    async notify(): Promise<void> {
        const CACHE = {} as Record<string, Embed>;

        const time = this.data.startDate;

        const promises = this.guilds.map(async ({ guild, settings }) => {
            const { language, timezone } = settings;
            const key = `${time}:${language}-${timezone}`;

            if (!CACHE[key]) {
                CACHE[key] = await drops.embedOne(this, guild.id, settings);
            }

            return CACHE[key];
        });

        await Promise.allSettled(promises);

        this.send((settings: Settings) => {
            const { language, timezone } = settings;
            const key = `${time}:${language}-${timezone}`;

            return CACHE[key];
        });
    }
};