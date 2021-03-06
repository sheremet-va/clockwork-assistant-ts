import { Subscriptions, NotifyData, Settings, Subscription } from '../modules/subscriptions';

import * as drops from '../helpers/drops';
import { Embed } from '../helpers/embed';

export default class extends Subscriptions implements Subscription {
    data!: drops.ApiDrop;
    translations!: drops.ApiTranslations;

    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'drops');
    }

    getKey(time: number, settings: Settings): string {
        const { language, timezone } = settings;

        return `${time}:${language}-${timezone}`;
    }

    async notify(): Promise<void> {
        const CACHE = {} as Record<string, Embed>;

        const time = this.data.startDate;

        const promises = this.guilds.map(async ({ guild, settings }) => {
            const key = this.getKey(time, settings);

            if (!(key in CACHE)) {
                CACHE[key] = await drops.embedOne(this, guild.id, settings);
            }

            return CACHE[key];
        });

        await Promise.allSettled(promises);

        return this.send((settings: Settings) => {
            const key = this.getKey(time, settings);

            return CACHE[key];
        });
    }
}
