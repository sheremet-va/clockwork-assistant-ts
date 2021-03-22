// Команда "СПРАВКА" выводит справку о командах бота.

import { Message } from 'discord.js';

import { Configuration, AssistantMessage, RequestInfo } from '../types';

import { Embed, EmbedColor, EmbedMedia } from '../helpers/embed';
import { entries } from '../helpers/utils';

import { version, author } from '../../package.json';
// import prefixes

type Command = {
    name: string;
    title: string;
    aliases: string[];
    category: string;
    usage: string;
    description: string;
}

type ApiResponse = {
    translations: {
        title: string;
        description: string;
        add_bot: string;
        click: string;
        usage: string;
        aliases: string;
        title_description: string;
    };
    data: Command[];
}

async function run(
    client: Assistant,
    { channel, ownerId: id }: AssistantMessage,
    _info: RequestInfo,
    args: string[] = []
): Promise<Message | false> {
    // TODO cache permLevel & helpShown & enabled
    const { translations, data } = await client.request('/help?id=' + id, channel, '1.0.0') as ApiResponse;

    const query = args.join('');
    const command = data.find(({ name, aliases }) => name === query || aliases.includes(query));

    const prefix = client.getPrefix(id);

    const embed = new Embed({
        color: EmbedColor.Help,
        thumbnail: EmbedMedia.Icon
    });

    if(command) {
        const {
            name,
            aliases,
            usage,
            title,
            description
        } = command;

        const names = [...aliases, name].filter(alias => alias !== title).map(alias => prefix + alias).join(', ');
        const usages = usage.split('\n').map(name => prefix + name).join('\n');

        embed
            .setTitle(translations.title.render({ command: title }))
            .setDescription(description)
            .addField(translations.usage, usages);

        if(names.length) {
            embed.addField(translations.aliases, names);
        }

        return channel.send(embed);
    }

    const commands = data
        .filter(({ name }) => {
            const cmd = client.commands.get(name);

            return cmd?.conf.enabled && cmd.conf.helpShown && (channel.type === 'text' || !cmd.conf.guildOnly);
        })
        .reduce((result, cmd) => {
            // TODO lang
            const category = cmd.category || 'Основная';

            return {
                ...result,
                [category]: [...(result[category] || []), cmd]
            };
        }, {} as Record<string, Command[]>);

    const fields = entries(commands).map(([category, cmds]) => {
        const description = cmds
            .map(cmd => `**${prefix}${cmd.title}**: ${cmd.description.toLowerFirst()}`)
            .join('\n');

        return { name: category, value: description, inline: false };
    });

    const addLink = `[${translations.click}](https://discordapp.com/api/oauth2/authorize?client_id=543021755841642506&permissions=486464&scope=bot)`;

    embed
        .setTitle('Clockwork Assistant')
        .setDescription(`**Clockwork Assistant ${version}** (by ${author}). ` + translations.description.render({ prefix }))
        .addFields([
            ...fields,
            { name: translations.add_bot, value: addLink }
        ]);

    return channel.send(embed);
}

const conf: Configuration = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'User',
};

export { run, conf };
