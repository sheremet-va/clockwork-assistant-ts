import { Subscriptions, NotifyData, Settings } from '../modules/subscriptions';
import { Embed } from '../helpers/embed';

import * as pledges from '../helpers/pledges';

export default class extends Subscriptions {
    data!: {
        today: pledges.Data;
        tomorrow: pledges.Data;
    }

    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'pledges');
    }

    async notify(): Promise<void> {
        const { today: string_today } = this.translations;
        const { today, tomorrow } = this.data;

        return this.send((settings: Settings) => {
            const embed = new Embed({
                author: string_today[settings.language],
                thumbnail: 'undaunted'
            });

            return pledges.embed(
                embed,
                settings,
                { data: tomorrow },
                { translations: this.translations, data: today }
            );
        });
    }
}