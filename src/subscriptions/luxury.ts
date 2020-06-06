import { Subscriptions, NotifyData, Settings } from '../modules/subscriptions';

import * as luxury from '../helpers/luxury';

export default class extends Subscriptions {
    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'luxury');
    }

    notify(): void {
        this.send((settings: Settings) => luxury.embed(this, settings));
    }
};