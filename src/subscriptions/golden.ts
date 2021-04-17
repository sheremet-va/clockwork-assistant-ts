import { Subscriptions, NotifyData, Settings } from '../modules/subscriptions';

import * as golden from '../helpers/golden';

export default class extends Subscriptions {
    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'golden');
    }

    async notify(): Promise<void> {
        return this.send((settings: Settings) => golden.embed(this, settings));
    }
}