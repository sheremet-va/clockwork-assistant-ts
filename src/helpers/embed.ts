import { MessageEmbed, EmbedField } from 'discord.js';
import { clean } from './utils';

interface Params {
    fields?: EmbedField[];
    title?: string;
    author?: string;
    description?: string;
    color?: EmbedColor | null;
    image?: EmbedMedia | null | string;
    footer?: string;
    thumbnail?: EmbedMedia;
    url?: string | null;
}

export enum Emoji {
    Success = ':white_check_mark: ',
    Error = ':no_entry_sign: '
}

export enum EmbedMedia {
    Icon = 'https://i.imgur.com/wqz33yi.png',
    Full = 'https://i.imgur.com/3xRNX7T.png',
    Wikipage = 'https://i.imgur.com/aDTDR5t.png',
    Golden = 'https://i.imgur.com/ndlYOa4.png',
    Luxury = 'https://i.imgur.com/DYHHd1i.png',
    Undaunted = 'https://i.imgur.com/1L2yJN1.png',
    UndauntedEgg = 'https://i.imgur.com/DT8Q8ac.png',
    Rueso = 'http://online.elderscrolls.net/images/1/12/RuESO_Light_Logo.png',
    Weekly = 'https://i.imgur.com/rVm69zx.png',
    Magnifier = 'https://i.imgur.com/OW7c5p8.png'
}

export enum EmbedColor {
    Help = 0x96D5A9,
    Golden = 0xFFF4A9,
    Luxury = 0x4365A4,
    Patch = 0xB20021,
    Pledges = 0x00AE86,
    Rueso = 0x958C78,
    Subscriptions = 0x5BA0DD,
    Weekly = 0xC6524A,
    Drops = 0x7F61C3,
    News = 0x02B0F4,
    Translate = 0x958C78,
    Success = 0x77B255,
    Error = 0xDD2E44
}

class Embed extends MessageEmbed {
    embed: Embed;

    static readonly colors = EmbedColor;
    static readonly media = EmbedMedia;
    static readonly emojis = Emoji;

    constructor(params: Params) {
        super();

        this.set(params);

        this.embed = this;
    }

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
            .setTitle(title)
            .setDescription(clean(description))
            .setFooter(footer)
            .addFields(fields)

        if (image) {
            this.setImage(image);
        }

        if(url) {
            this.setURL(url);
        }

        if (color) {
            this.setColor(color);
        }

        if (thumbnail) {
            this.setThumbnail(thumbnail);
        }
    }

    setColor(color: EmbedColor): this {
        super.setColor(color);

        return this;
    }

    setImage(image: EmbedMedia | string): this {
        super.setImage(image);

        return this;
    }

    setThumbnail(thumbnail: EmbedMedia | string): this {
        super.setThumbnail(thumbnail);

        return this;
    }

    setFooter(footer: string, url?: string): this {
        super.setFooter(footer, url);

        if(footer) {
            this.setTimestamp();
        }

        return this;
    }
}

export { Embed };
export default Embed;