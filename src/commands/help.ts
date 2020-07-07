// Команда "СПРАВКА" выводит справку о командах бота.

import { Message } from 'discord.js';

import { Configuration, AssistantMessage, RequestInfo } from '../types';

import { Embed } from '../helpers/embed';
import { entries } from '../helpers/utils';

import { version, author } from '../../package.json';
// import prefixes

type Command = {
    name: string;
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
    { channel, id }: AssistantMessage,
    _info: RequestInfo,
    args: string[] = []
): Promise<Message | false> {
    // TODO cache permLevel & helpShown & enabled
    const { translations, data } = await client.request('/help?id=' + id, channel, '1.0.0') as ApiResponse;

    const query = args.join('');
    const command = data.find(({ name, aliases }) => name === query || aliases.includes(query));

    const prefix = client.getPrefix(id);

    const embed = new Embed({
        color: 'help',
        thumbnail: 'icon'
    });

    if(command) {
        const {
            name,
            aliases,
            usage,
            description
        } = command;

        const names = aliases.map(alias => prefix + alias).join(', ');

        embed
            .setTitle(translations.title.render({ command: name }))
            .setDescription(description)
            .addFields([
                { name: translations.usage, value: prefix + usage, inline: false },
                { name: translations.aliases, value: names, inline: false }
            ]);

        return channel.send(embed);
    }

    const commands = data.reduce((result, cmd) => {
        const category = cmd.category;

        return {
            ...result,
            [category]: [...(result[category] || []), cmd]
        };
    }, {} as Record<string, Command[]>);

    const fields = entries(commands).map(([category, cmds]) => {
        const description = cmds
            .map(cmd => `**${prefix}${cmd.name}**: ${cmd.description.toLowerFirst()}`)
            .join('\n');

        return { name: category, value: description, inline: false };
    });

    const addLink = `[${translations.click}](https://discordapp.com/api/oauth2/authorize?client_id=543021755841642506&permissions=486464&scope=bot)`;

    embed
        .setTitle('Clockwork Assistant')
        .setDescription(`**Clockwork Assistant ${version}** (by ${author}).` + translations.description)
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
