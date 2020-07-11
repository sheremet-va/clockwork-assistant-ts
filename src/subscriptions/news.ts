import { Subscriptions, NotifyData } from '../modules/subscriptions';

import { Embed } from '../helpers/embed';
import { Item } from '../helpers/pledges';

type Data = {
    link: Item;
    title: Item;
    description: Item;
    image: string;
}

export default class extends Subscriptions {
    data!: Data;

    constructor(client: Assistant, info: NotifyData) {
        super(client, info, 'news');
    }

    async notify(): Promise<void> {
        this.send(({ newsLang }) => {
            const {
                title,
                link,
                description,
                image
            } = this.data;

            return new Embed({
                title: title[newsLang],
                url: link[newsLang],
                description: description[newsLang],
                image,
                color: 'news'
            });
        });
    }
}