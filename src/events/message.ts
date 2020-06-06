// Событие MESSAGE запускается каждый раз, когда кто-то отправляет сообщение.

import { AssistantMessage } from '../types';
import { TextChannel, Message, User } from 'discord.js';

function checkPermissions(channel: TextChannel, bot: User): boolean {
    const permissions = channel.permissionsFor(bot.id);

    if(!permissions) {
        return false;
    }

    if (!permissions.has('EMBED_LINKS', false)) {
        // client.logger.error( `У бота нет прав отправлять ссылки в канал «${message.channel.name}» (${message.channel.id}) в гильдии «${message.guild.name}» (${message.guild.id}). Владельцу (${message.guild.owner.user.tag}) отправлено сообщение.` );
        // if ( level > 2 ) return message.guild.owner.send( `Возникла ошибка при попытке отправить сообщение в канал «${message.channel.name}» в гильдии «${message.guild.name}». Пожалуйста, если вы не хотите больше видеть это сообщение, выдайте боту права «Встраивать ссылки» в канале «${message.channel.name}».` );
        return false;
    }
    else if (!permissions.has('SEND_MESSAGES', false)) {
        // client.logger.error( `У бота нет прав отправлять сообщения в канал «${message.channel.name}» (${message.channel.id}) в гильдии «${message.guild.name}» (${message.guild.id}). Владельцу (${message.guild.owner.user.tag}) отправлено сообщение.` );
        // if ( level > 2 ) return message.guild.owner.send( `Возникла ошибка при попытке отправить сообщение в канал «${message.channel.name}» в гильдии «${message.guild.name}». Пожалуйста, если вы не хотите больше видеть это сообщение, выдайте боту права «Отправлять сообщения» в канале «${message.channel.name}».` );
        return false;
    }

    return true;
}

function log(message: AssistantMessage): string {
    if (message.guild) {
        const channel = message.channel as TextChannel;

        return `${message.author.tag} from '${message.guild.name}' launches ${message.content} in '${channel.name}'.`;
    }

    return `${message.author.tag} launches ${message.content} in DM.`;
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

    const user = await client.getUser(message.id);

    const settings = message.settings = user.settings;
    message.subs = user.subscriptions;
    message.languages = user.languages;

    const level = client.permlevel(message);
    message.author.permLevel = level;

    const args = message.args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = message.command = (args.shift() || '').toLowerCase();

    if (!message.member && message.guild) {
        await message.guild.members.fetch(message.author);
    }

    const alias = client.aliases.get(command);

    const cmd = client.commands.get(command) || client.commands.get(alias || '');

    if (!cmd) return;

    if (message.guild && !checkPermissions(message.channel as TextChannel, bot)) {
        return;
    }

    const permLevel = client.config.permLevels.find(l => l.level === level);

    if(!permLevel) {
        client.logger.error(`No permission found for ${command} command: ${level}.`);

        return;
    }

    client.logger.cmd(permLevel.name + ' ' + log(message));

    const info = cmd.conf.path
        ? await client.request(cmd.conf.path + '?id=' + message.id, message.channel, '1.0')
        : {};

    const result = await cmd.run(client, message, info, args);

    if (typeof result === 'boolean' && !result) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const helpCmd = client.commands.get('help')!;

        helpCmd.run(client, message, info, [command]);
    }

    if (typeof result === 'string') {
        const customCmd = client.commands.get(result);

        if(customCmd) {
            customCmd.run(client, message, info, args);
        }
    }
};
