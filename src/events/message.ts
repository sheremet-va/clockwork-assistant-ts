// Событие MESSAGE запускается каждый раз, когда кто-то отправляет сообщение.

import { TextChannel, Message, BitFieldResolvable, PermissionString } from 'discord.js';

import { AssistantMessage } from '../types';
import { ClientError, ErrorEmbed } from '../modules/error';
import { store } from '../modules/store';
import { Embed } from '../helpers/embed';

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
        ? await client.request(cmd.conf.path + '?id=' + message.ownerId, message.channel, '1.0')
        : {};
}

async function confirmOrder(client: Assistant, message: AssistantMessage) {
    const orders = await store.getOrdersByUser(message.author.id, { status: 'accepted' });

    const order = orders.find(order => order.sellerID);

    if(!order) return;

    const orderID = order.orderID;
    const sellerID = order.sellerID!;

    try {
        const seller = await client.users.fetch(sellerID);

        const url = `https://discordapp.com/channels/${client.config.dealers.guildID}/${client.config.dealers.managerChannelID}/${orderID}`;

        const MESSAGE_SENT_GOLD = await store.get('messages', 'user_sent_gold');

        await seller.send(new Embed({
            color: 'help',
            url,
            title: `Золото по заказу ${orderID} отправлено`,
            description: MESSAGE_SENT_GOLD.render(order)
        }).setFooter(`Покупатель: ${order.user}`));

        await store.updateOrderStatus(order.orderID, 'user_sent_gold', message.author.id);

        const MESSAGE_USER_SENT_GOLD_RESPONSE = await store.get('messages', 'user_sent_gold_response');

        await message.author.send(new Embed({
            color: 'help',
            description: MESSAGE_USER_SENT_GOLD_RESPONSE.render(order)
        }).setFooter(`Менеджер @${seller.tag}. Заказ: ${orderID}`, seller.avatarURL() || seller.defaultAvatarURL));
    } catch(err) {
        client.logger.error('SellerOrdersError',`Не удалось отправить сообщение менеджеру ${order.seller} (${orderID}): ${err.message}.`, err.stack);
    }
}

// async function createInvite(client: Assistant, message: AssistantMessage) {
//     const channel = client.channels.cache.get('752154861818085490') as GuildChannel;
//
//     if(!channel || channel.type !== 'text') {
//         return;
//     }
//
//     const invite = await channel.createInvite(
//         {
//             maxAge: 10 * 60 * 1000,
//             maxUses: 1,
//             reason: ''
//         }
//     );
//
//     return message.reply(invite);
// }

async function event(
    client: Assistant,
    message: AssistantMessage
): Promise<Message | undefined> {
    const bot = client.user;

    if (!bot || message.author.bot) return;

    if(message.content === '+' && message.channel.type === 'dm') {
        await confirmOrder(client, message);
        return;
    }

    // if(message.content === '?' && message.channel.type === 'dm') {
    //     await createInvite(client, message);
    //     return;
    // }

    message.ownerId = message.guild ? message.guild.id : message.author.id;
    message.name = message.guild ? message.guild.name : message.author.tag;

    const prefix = client.getPrefix(message.ownerId);

    const prefixMention = new RegExp(`^<@!?${bot.id}>( |)$`);

    if (prefixMention.test(message.content)) {
        return message.reply(`my prefix on this server is \`${prefix}\``);
    }

    if (!message.content.startsWith(prefix)) return;

    const content = message.content.slice(prefix.length).trim();

    const command = /^([^\s]+)/.exec(content) || [null, ''];

    if(!command[1]) {
        return;
    }

    message.command = command[1].toLowerCase();

    const formattedArgs = content.slice(message.command.length).trim().split(/ +/g);

    const args = message.args = formattedArgs.length && formattedArgs[0] !== '' ? formattedArgs : [];

    if (!message.member && message.guild) {
        await message.guild.members.fetch(message.author);
    }

    const alias = client.aliases.get(message.command);

    const cmd = client.commands.get(message.command) || client.commands.get(alias || '');

    if (!cmd) return;

    // TODO CACHE, remove cache on certain commands
    const user = await client.getUser(message.ownerId);

    message.settings = user.settings;
    message.subs = user.subscriptions;
    message.languages = user.languages;

    const level = client.permlevel(message);
    message.author.permLevel = level;

    if (message.guild && !await checkPermissions(client, message)) {
        return;
    }

    if(!message.guild && cmd.conf.guildOnly) {
        return;
    }

    if(level < client.levelCache[cmd.conf.permLevel]) {
        return;
    }

    const permLevel = client.config.permLevels.find(l => l.level === level);

    if(!permLevel) {
        client.logger.error('PermError', `No permission found for ${command} command: ${level}.`);

        return;
    }

    message.author.permLevelName = permLevel.name;

    client.logger.cmd(permLevel.name + ' ' + log(message), message);

    const info = await getInfo(client, cmd, message);

    try {
        const result = await cmd.run(client, message, info, args);

        if (typeof result === 'boolean' && !result) {
            const helpCmd = client.commands.get('help')!;

            helpCmd.run(client, message, info, [message.command]);
        }

        if (typeof result === 'string') {
            const customCmd = client.commands.get(result);

            if(customCmd) {
                const info = await getInfo(client, customCmd, message);

                customCmd.run(client, message, info, args);
            }
        }
    } catch (err) {
        if (err instanceof ClientError) {
            const message = err.message || err.description;

            err.channel
                ? err.channel.send(new ErrorEmbed(message))
                : client.logger.error('ClientErrorRejection', message);
        }

        if(err instanceof Error) {
            const message = err.message;

            client.logger.error(
                'Unhandled rejection',
                message.replace(new RegExp(`${__dirname}/`, 'g'), './'),
                err.stack
            );
        }
    }
}

export { event };
