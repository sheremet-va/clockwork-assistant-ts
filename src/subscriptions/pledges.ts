import { Subscriptions, NotifyData, Settings } from '../modules/subscriptions';
import { Embed } from '../helpers/embed';

import * as pledges from '../helpers/pledges';

export default class extends Subscriptions {
    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'pledges');
    }

    notify() {
        const { today: string_today } = this.translations;
        const { today, tomorrow } = this.data;

        this.send((settings: Settings) => {
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
};