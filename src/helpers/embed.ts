import { MessageEmbed, EmbedField } from 'discord.js';

interface Params {
    fields?: EmbedField[];
    title?: string;
    author?: string;
    description?: string;
    color?: Color | null;
    image?: Media | null | string;
    footer?: string;
    thumbnail?: Media;
    url?: string | null;
}

type Emoji = 'success' | 'error';

export declare type Media =
    | 'icon'
    | 'full'
    | 'wikipage'
    | 'golden'
    | 'luxury'
    | 'undaunted'
    | 'undauntedEgg'
    | 'rueso'
    | 'weekly'
    | 'magnifier'

export declare type Color =
    | 'help'
    | 'golden'
    | 'luxury'
    | 'patch'
    | 'pledges'
    | 'rueso'
    | 'subscriptions'
    | 'weekly'
    | 'drops'
    | 'news'
    | 'translate'
    | 'success'
    | 'error'

class Embed extends MessageEmbed {
    constructor(params: Params) {
        super();

        this.set(params);
    }

    static get colors(): { [k in Color]: number } {
        return {
            help: 0x96D5A9,
            golden: 0xFFF4A9,
            luxury: 0x4365A4,
            patch: 0xB20021,
            pledges: 0x00AE86,
            rueso: 0x958C78,
            subscriptions: 0x5BA0DD,
            weekly: 0xC6524A,
            drops: 0x7F61C3,
            news: 0x02B0F4,
            translate: 0x958C78,
            success: 0x77B255,
            error: 0xDD2E44
        };
    }

    static get media(): { [k in Media]: string } {
        return {
            icon: 'https://i.imgur.com/wqz33yi.png',
            full: 'https://i.imgur.com/3xRNX7T.png',
            wikipage: 'https://i.imgur.com/aDTDR5t.png',
            golden: 'https://i.imgur.com/ndlYOa4.png',
            luxury: 'https://i.imgur.com/DYHHd1i.png',
            undaunted: 'https://i.imgur.com/1L2yJN1.png',
            undauntedEgg: 'https://i.imgur.com/DT8Q8ac.png',
            rueso: 'http://online.elderscrolls.net/images/1/12/RuESO_Light_Logo.png',
            weekly: 'https://i.imgur.com/rVm69zx.png',
            magnifier: 'https://i.imgur.com/OW7c5p8.png'
        };
    }

    static get emojis(): { [k in Emoji]: string } {
        return {
            success: ':white_check_mark: ',
            error: ':no_entry_sign: '
        };
    }

    // has<T, K>(object: T, key: K): object is { [key: K]: unknown } {
    //     return key in object;
    // }

    set(params: Params): void {
        const {
            fields = [],
            title = '',
            author = '',
            description = '',
            color = null,
            image = '',
            footer = '',
            thumbnail,
            url = ''
        } = params;

        this.setAuthor(author)
            .addFields(fields)
            .setTitle(title)
            .setDescription(description)
            .setFooter(footer)
            .setURL(url || '');

        if (image) {
            this.setImage(image);
        }

        if (color) {
            this.setColor(color);
        }

        if (thumbnail) {
            this.setThumbnail(thumbnail);
        }
    }

    setColor(color: Color): this {
        super.setColor(Embed.colors[color] || color);

        return this;
    }

    setImage(image: Media | string): this {
        if (image in Embed.media) {
            super.setImage(Embed.media[image as Media]);
        } else {
            super.setImage(image);
        }

        return this;
    }

    setThumbnail(thumbnail: Media): this {
        super.setThumbnail(Embed.media[thumbnail] || thumbnail);

        return this;
    }
}

export { Embed };