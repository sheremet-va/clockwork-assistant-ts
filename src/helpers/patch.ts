/* eslint-disable @typescript-eslint/no-unused-vars */
import { Embed } from '../helpers/embed';

// { translations, data },
// { language }

// TODO для разных языков сделать
function embed({ data }: { data: Record<string, string> }): Embed {
    const { title, link, description, image } = data;

    return new Embed({
        title,
        description,
        color: 'patch',
        image,
        url: link
    });
}

export { embed };