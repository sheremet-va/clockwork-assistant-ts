// Событие MESSAGE запускается каждый раз, когда кто-то отправляет сообщение.

import { TextChannel, Message, BitFieldResolvable, PermissionString } from 'discord.js';

import { AssistantMessage } from '../types';
import { ErrorEmbed } from '../modules/error';

async function checkPermissions(client: Assistant, message: AssistantMessage): Promise<boolean> {
    const channel = message.channel as TextChannel;
    const permissions = channel.permissionsFor(client.user!.id);

    if(!permissions) {
        return false;
    }

    const names = ['EMBED_LINKS', 'SEND_MESSAGES'] as BitFieldResolvable<PermissionString>[];

    const disabled = names.find(name => !permissions.has(name, false));

    if(!disabled) {
        return true;
    }

    const isAdmin = message.author.permLevel > 2;

    const subject = `'${message.channel.id}' channel in '${message.guild!.id}' guild`;
    const notice = isAdmin ? ` ${message.author.tag} got a message.` : '';

    client.logger.error('MessageError', `${subject} doesn't have '${disabled}' permission.${notice}`);

    if(isAdmin) {
        const guild = message.guild!;

        const error = 'PERMISSION_MESSAGE';
        const pathError = `/translations/errors/errors/${error}?id=${guild.id}`;
        const pathNames = `/translations/subscriptions/permissions/${disabled}?id=${guild.id}`;

        const { translations: errorString } = await client.request(pathError, null, '1.0');
        const { translations: name } = await client.request(pathNames, null, '1.0');

        const render = {
            guild: guild.name,
            channel: channel.name,
            permission: name
        };

        const embed = new ErrorEmbed(errorString.render(render));

        await message.author.send(embed);
    }

    return false;
}

function log(message: AssistantMessage): string {
    if (message.channel.type === 'text' && message.guild) {
        const { channel, guild, content, author} = message;

        return `${author.id} from '${guild.id}' guild launches ${content} in '${channel.id}' channel.`;
    }

    return `${message.author.id} launches ${message.content} in DM.`;
}

async function getInfo(client: Assistant, cmd: { conf: { path?: string } }, message: AssistantMessage): Promise<object> {
    return cmd.conf.path
        ? await client.request(cmd.conf.path + '?id=' + message.id, message.channel, '1.0')
        : {};
}

export default async (
    client: Assistant,
    message: AssistantMessage
): Promise<Message | undefined> => {
    const bot = client.user;

    if (!bot || message.author.bot) return;

    message.id = message.guild ? message.guild.id : message.author.id;
    message.name = message.guild ? message.guild.name : message.author.tag;

    const prefix = client.getPrefix(message.id);

    const prefixMention = new RegExp(`^<@!?${bot.id}>( |)$`);

    if (prefixMention.test(message.content)) {
        return message.reply(`my prefix on this server is \`${prefix}\``);
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = message.command = (args.shift() || '').toLowerCase();

    if (!message.member && message.guild) {
        await message.guild.members.fetch(message.author);
    }

    const alias = client.aliases.get(command);

    const cmd = client.commands.get(command) || client.commands.get(alias || '');

    if (!cmd) return;

    // TODO CACHE, remove cache on certain commands
    const user = await client.getUser(message.id);

    message.settings = user.settings;
    message.subs = user.subscriptions;
    message.languages = user.languages;

    const level = client.permlevel(message);
    message.author.permLevel = level;

    if (message.guild && !await checkPermissions(client, message)) {
        return;
    }

    const permLevel = client.config.permLevels.find(l => l.level === level);

    if(!permLevel) {
        client.logger.error('PermError', `No permission found for ${command} command: ${level}.`);

        return;
    }

    client.logger.cmd(permLevel.name + ' ' + log(message), message);

    const info = await getInfo(client, cmd, message);

    const result = await cmd.run(client, message, info, args);

    if (typeof result === 'boolean' && !result) {
        const helpCmd = client.commands.get('help')!;

        helpCmd.run(client, message, info, [command]);
    }

    if (typeof result === 'string') {
        const customCmd = client.commands.get(result);

        if(customCmd) {
            const info = await getInfo(client, customCmd, message);

            customCmd.run(client, message, info, args);
        }
    }
};