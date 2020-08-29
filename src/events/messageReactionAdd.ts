import { MessageReaction, TextChannel, User } from 'discord.js';
import { store } from '../modules/store';
import { Embed } from '../helpers/embed';

function checkRole(client: Assistant, userID: string): { prev: string; cur: string } | undefined {
    const orders = store.filterArray(value => {
        if(typeof value !== 'object' || !('orderID' in value)) {
            return false;
        }

        return value.userID === userID && value.status === store.get('conf', 'order_completed_status');
    });

    const crownsBought = orders.reduce((total, order) => {
        return total + parseInt(order.crown_price);
    }, 0);

    const roleIndex = client.config.dealers.roles.findIndex(([, limit]) => crownsBought <= limit);

    if(roleIndex === -1) {
        return;
    }

    const curRole = client.config.dealers.roles[roleIndex];
    const prevRole = roleIndex === 0 ? '' : client.config.dealers.roles[roleIndex - 1];

    return { prev: prevRole[0], cur: curRole[0] };
}

async function event(
    client: Assistant,
    reaction: MessageReaction,
    user: User
): Promise<void> {
    if(!reaction || !reaction.emoji) {
        return;
    }

    const messageID = reaction.message.id;

    if(reaction.message.channel.id !== client.config.dealers.managerChannelID) {
        return;
    }
    const order = store.get(messageID);

    if(!order) {
        await user.send(new Embed({
            color: 'error',
            description: `Не удалось найти заявку ${messageID}.`
        }));
        return;
    }

    const emojis = store.get('emojis');
    const emoji = reaction.emoji.name;

    const code = (Object.entries(emojis).find(([, name]) => emoji === name) || [null])[0];

    if(!code) {
        return;
    }

    const foundSeller = store.get('managers').find((name: string) => name.includes(user.id));

    if(!foundSeller) {
        await user.send(new Embed({
            color: 'error',
            description: 'Вас нет в списке менеджеров, поэтому вы не можете распоряжаться заказами.'
        }));
        return;
    }

    const [sellerID, seller] = foundSeller.split(':');
    const message = store.get('messages', code).render({ ...order, seller });

    const orderUser = await client.users.fetch(order.userID);

    if(!orderUser) {
        await user.send(new Embed({
            color: 'error',
            description: `Не удалось обработать заявку ${messageID}, т.к. не был найден пользователь.`
        }));
        return;
    }

    try {
        const userMessage = await orderUser.send(new Embed({
            color: 'help',
            description: message
        }).setFooter(`Менеджер @${user.username}. Заказ: ${order.orderID}`, user.avatarURL() || user.defaultAvatarURL));

        store.set(messageID, seller, 'seller');
        store.set(messageID, sellerID, 'sellerID');
        store.set(messageID, code, 'status');
        store.push(messageID, [code, sellerID, new Date().valueOf()], 'lifecycle');

        if(code === store.get('conf', 'user_sent_gold_status')) {
            store.set('user-messages', messageID, userMessage.id);
        }

        if(code === store.get('conf', 'order_completed_status')) {
            const channelDone = await client.channels.fetch(client.config.dealers.ordersDoneChannelID) as TextChannel;

            await channelDone.send(new Embed({
                color: 'help',
                title: store.get('messages', 'order_done_title').render(order),
                description: store.get('messages', 'order_done_description').render(order)
            }));

            const role = checkRole(client, order.userID);

            if(role && reaction.message.guild) {
                const guildUser = await reaction.message.guild.members.fetch(order.userID);

                if(guildUser) {
                    if(!guildUser.roles.cache.has(role.cur)) {
                        await guildUser.roles.add(role.cur);
                    }

                    if(role.prev && guildUser.roles.cache.has(role.prev)) {
                        await guildUser.roles.remove(role.prev);
                    }
                }
            }
        }
    } catch (err) {
        await user.send(new Embed({
            color: 'error',
            description: `Не удалось обработать заявку ${messageID} из-за ошибки ${err.message}. Возможно, пользователь запретил получение сообщений от ботов.`
        }));
        return;
    }
}

export { event };
