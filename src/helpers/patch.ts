/* eslint-disable @typescript-eslint/no-unused-vars */
import { Embed, EmbedColor } from '../helpers/embed';
import { translate } from './utils';
import { Item } from '../types';

type Keys = 'title' | 'link' | 'description';

export declare type DataSubscriptions = {
    [k in Keys]: Item;
} & {
    image: string;
}

export declare type DataCommand = {
    [k in Keys]: string;
} & {
    image: string;
}

// TODO для разных языков сделать
function embed({ data }: { data: DataSubscriptions | DataCommand }, lang: string): Embed {
    const { title, link, description, image } = data;

    return new Embed({
        title: translate(title, lang),
        description: translate(description, lang),
        color: EmbedColor.Patch,
        image,
        url: translate(link, lang)
    });
}

export { embed };