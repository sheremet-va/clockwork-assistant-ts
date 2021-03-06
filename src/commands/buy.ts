// Этот огромный файл не должен быть таким огромным
// Как это вообще произошло?
// TODO Вынести весь функционал в отдельного бота

import { TextChannel } from 'discord.js';

import { Lifecycle, Order, store } from '../modules/store';

import { ClientError } from '../modules/error';
import { AssistantMessage, Configuration, RequestInfo } from '../types';

import { Embed } from '../helpers/embed';

const ESO_URL = 'https://www.elderscrollsonline.com';

function getHelp(): Embed {
    const fields = [
        {
            name: 'manager',
            value: 'добавляет новых менеджеров (в формате discordID:EsoUserID)\n`-buy conf manager 12345:Orion`'
        },
        {
            name: 'removeManager',
            value: 'удаляет менеджеров (в формате discordID:EsoUserID)\n`-buy conf removeManager 12345:Orion`'
        },
        {
            name: 'discount',
            value: 'выставляет скидку для гильдии или включает/отключает все скидки\n`-buy conf discount disable/enable`\n`-buy conf discount 10 GuildName, Guild With Long Name`'
        },
        {
            name: 'message',
            value: 'возвращает список доступных сообщений, текст сообщения или меняет на другое сообщение. Внутри доступны переменные из команды `get`. Они пишутся внутри `{{}}` - например, `{{name}}`\n`-buy conf message`\n`-buy conf message confirm`\n`-buy conf message confirm {{user}}, ты точно уверен?`'
        },
        {
            name: 'emoji',
            value: 'возвращает список доступных кодов для эмодзи и позволяет и менять\n`-buy conf emoji`\n`-buy conf emoji cancel x`'
        },
        {
            name: 'settings',
            value: 'возвращает список доступных настроек или меняет их значения.\n`-buy conf settings`\n`-buy conf settings setting_name`'
        },
        {
            name: 'update',
            value: 'обновляет текущее состояния магазина и его цен\n`-buy conf update`'
        },
        {
            name: 'get',
            value: 'возвращает доступную информацию по заказу. ID заказа такой же, что и ID сообщения\n`-buy conf get 123443422453`'
        },
        {
            name: 'user',
            value: 'возвращает доступную информацию по заказам покупателя. \n`-buy conf user 123443422453`'
        }
    ];

    return new Embed({
        color: 'help',
        title: 'Доступные команды',
        fields: fields.map(f => ({ ...f, inline: false }))
    });
}

async function addManagers(args: string[]): Promise<Embed> {
    const managers = await store.get('managers');

    await Promise.all(args.map(async manager => {
        const [discordId] = manager.split(':');

        const having = managers.find(name => name.includes(discordId));

        if(having) {
            await store.remove('managers', having);
        }

        await store.push('managers', manager);
    }));

    return new Embed({
        color: 'help',
        description: args.length ? ('Были добавлены следующие менеджеры: \n• ' + args.join(', \n• ') + '\n') : ''
            + 'Текущие менеджеры: \n• ' + (args.length ? args.join(', \n• ') : managers.join(', \n• '))
            + '\nЧтобы добавить новых менеджеров, введите их ники в формате "discordId:userId" (без кавычек и знака @, через пробел). '
            + 'Например, \n`-buy conf 12334:Orion 55555:Vivienn`.'
    });
}

async function removeManagers(args: string[]): Promise<Embed> {
    await Promise.all(args.map(manager => {
        return store.remove('managers', manager);
    }));

    const managers = await store.get('managers');

    return new Embed({
        color: 'help',
        description: args.length ? ('Были удалены следующие менеджеры: \n• ' + args.join(', \n• ') + '\n') : ''
            + 'Текущие менеджеры: \n• ' + managers.join(', \n• ')
    });
}

async function processDiscount(args: string[]): Promise<Embed> {
    const [discount, ...guilds] = args;

    if(discount === 'disable') {
        await store.set('discount_status', false);

        return new Embed({
            color: 'help',
            description: 'Все скидки отключены. Чтобы включить скидки, введите команду `-buy conf discount enable`.'
        });
    }

    if(discount === 'enable') {
        await store.set('discount_status', true);

        return new Embed({
            color: 'help',
            description: 'Скидки включены. Чтобы отключить скидки, введите команду `-buy conf discount disable`.'
        });
    }

    if(!guilds.length) {
        return new Embed({
            color: 'help',
            description: 'На данный момент для гильдий выставлены следующие скидки:\n' +
                Object.entries(await store.get('discounts')).map(([name, disc]) => `• ${name}: ${disc} золотых.`).join('\n')
        });
    }

    const guildsNames = guilds.join(' ').split(',');

    guildsNames.forEach(guild => store.set('discounts', discount, guild.trim()));

    return new Embed({
        color: 'help',
        description: `Для гильдий ${guildsNames.join(', ')} была выставлена скидка ${discount} золотых.`
    });
}

async function processMessages(client: Assistant, message: AssistantMessage, args: string[]): Promise<Embed> {
    const [code, ...messageArgs] = args;
    const resultMessage = messageArgs.join(' ');

    if(!code) {
        const fields = Object.entries(await store.get('messages')).map(([code, message]) => {
            return {
                name: code,
                value: `${message}`,
                inline: false
            };
        });

        return new Embed({
            color: 'help',
            title: 'Доступные коды сообщений',
            fields
        });
    }

    const was = new Embed({
        title: 'Прежнее сообщение',
        color: 'help',
        description: await store.get('messages', code)
    });

    if(!resultMessage.length) {
        return was;
    }

    const will = new Embed({
        title: 'Будущее сообщение',
        color: 'help',
        description: resultMessage
    });

    await message.channel.send(was);
    await message.channel.send(will);

    const reply = await client.awaitReply(message, 'Вы действительно хотите изменить сообщение? (Да/Нет)');

    if(reply === 'Да' || reply === 'да') {
        await store.set('messages', resultMessage, code);

        return new Embed({
            description: `Сообщение ${code} сохранено`,
            color: 'help'
        });
    } else {
        return new Embed({
            description: 'Операция отменена.',
            color: 'help'
        });
    }
}

async function getOrdersByUserId(userId: string) {
    const orders = await store.getOrdersByUser(userId);

    const statusEnded = await store.get('conf', 'order_completed_status');

    const description = orders.map((order, i) => {
        const status = {
            [statusEnded]: '',
            canceled: ' - отменен'
        };

        return `${i + 1}. ${order.name} (${order.crown_price} крон)${order.status in status ? status[order.status] : ' - в процессе'}`;
    });

    const sum = orders.reduce((total, order) => {
        if(order.status !== statusEnded) {
            return total;
        }

        return total + order.products.reduce((sum, product) => sum + product.crown_price, 0);
    }, 0);

    return {
        description,
        sum
    };
}

async function getUserOrders(client: Assistant, userId: string) {
    const {
        description,
        sum
    } = await getOrdersByUserId(userId);

    const user = client.users.cache.get(userId);

    const tag = (user || { tag: userId }).tag;

    const crownsTitle = description.length.pluralize(['товар', 'товара', 'товаров'], 'ru');

    const price = new Intl.NumberFormat('ru-RU').format(sum);
    const list = description.join('\n');

    const messageBought = `Покупатель ${tag} купил ${crownsTitle} на общую сумму ${price} крон:\n${list}`.substr(0, 2000);
    const messageEmpty = `${tag} ничего не приобретал.`;

    return new Embed({
        color: 'help',
        description: sum > 0 ? messageBought : messageEmpty,
    }).setFooter(`Покупатель: ${tag}`, user ? (user.avatarURL() || user.defaultAvatarURL) : undefined);
}

async function showOrders(message: AssistantMessage) {
    const {
        description,
        sum
    } = await getOrdersByUserId(message.author.id);

    const crownsTitle = description.length.pluralize(['товар', 'товара', 'товаров'], 'ru');

    const price = new Intl.NumberFormat('ru-RU').format(sum);
    const list = description.join('\n');

    const messageBought = `Вы купили ${crownsTitle} на общую сумму ${price} крон:\n${list}`.substr(0, 2000);
    const messageEmpty = 'Вы ничего не покупали';

    return message.channel.send(new Embed({
        color: 'help',
        description: description.length ? messageBought : messageEmpty
    }).setAuthor('Последние заказы ' + message.author.tag, message.author.avatarURL() || message.author.defaultAvatarURL));
}

async function processEmoji(client: Assistant, args: string[]): Promise<Embed> {
    const [code, value] = args;

    const guild = client.guilds.cache.get(client.config.dealers.guildID);

    if(!code) {
        const emojis = await store.get('emojis');
        const description = Object.entries(emojis).map(([code, emoji]) => {
            const clEmoji = guild && guild.emojis.cache.find(e => e.name === emoji);
            return `• Код "${code}": ${clEmoji || `:${emoji}:`} \`${emoji}\``;
        }).join('\n');

        return new Embed({
            color: 'help',
            description
        });
    }

    const emojiMatch = /:([\w_~\-\d]+):/g.exec(value);

    const emoji = emojiMatch ? emojiMatch[1] : value;

    if(!emoji) {
        return new Embed({
            color: 'error',
            description: 'Не введен код для эмодзи. Верный синтаксис: `-buy conf emoji canceled x`'
        });
    }

    await store.set('emojis', emoji, code);

    const clEmoji = guild && guild.emojis.cache.find(e => e.name === emoji);

    return new Embed({
        color: 'help',
        description: `Коду "${code}" было выставлено эмодзи ${clEmoji || `:${emoji}:`} \`:${emoji}:\``
    });
}

async function getOrder(orderID: string, property: keyof Order): Promise<Embed | string> {
    const order = await store.getOrderById(orderID);

    if(!order) {
        return new Embed({
            color: 'error',
            description: 'Заявки не найдено.'
        });
    }

    const result = property ? (order[property] || order) : order;

    return `\`\`\`js\n${JSON.stringify(result, null, 2).substr(0, 1950)}\n\`\`\``;
}

async function updateStore(client: Assistant, message: AssistantMessage): Promise<false> {
    const msg = await message.channel.send(new Embed({
        color: 'help',
        description: 'Запускаю обновление магазина...'
    }));

    try {
        const { data } = await client.request({
            url: '/store/update?id=' + message.ownerId,
            method: 'post',
            data: {}
        }, message.channel, '1.0.0');

        await msg.edit(new Embed({
            color: 'success',
            description: `Состояние магазина успешно обновлено за ${((new Date().valueOf() - msg.createdTimestamp) / 1000).toFixed(2)} c. ` +
                `Добавлено ${data.added.pluralize(['предмет', 'предмета', 'предметов'], 'ru')}.`
        }));
    } catch (err) {
        await msg.edit(new Embed({
            color: 'error',
            description: `Произошла ошибка при попытке обновить магазин: ${err.message}.`
        }));
    }

    return false;
}

async function changeSettings(args: string[]): Promise<Embed> {
    const [setting, value] = args;

    const config = await store.get('conf');

    if(!setting) {
        const fields = Object.entries(config).map(([code, value]) => {
            return {
                name: code,
                value: `${value}`,
                inline: false
            };
        });

        return new Embed({
            color: 'help',
            description: 'Доступные настройки',
            fields
        });
    }

    if(!(setting in config)) {
        return new Embed({
            color: 'error',
            description: 'Нет такой настройки.'
        });
    }

    await store.set('conf', value, setting);

    return new Embed({
        color: 'help',
        description: `Настройке "${setting}" выставлено значение ${value}.`
    });
}

async function configure(client: Assistant, message: AssistantMessage, args: string[]): Promise<false | Embed | string> {
    const managers = await store.get('managers');
    const author = message.author.id;

    if(!managers.find(name => name.includes(author))) {
        throw new ClientError('У вас нет права использовать эту команду.', '', message.channel);
    }

    const [, action, ...actionArgs] = args;

    if(!action) {
        return getHelp();
    }

    // -buy conf manager discordId:userId discordId:userId ...
    if(action === 'manager' || action === 'managers') {
        return addManagers(actionArgs);
    } else if(action === 'removeManager' || action === 'removeManagers') {
        return removeManagers(actionArgs);
    } else if(action === 'discount') {
        return processDiscount(actionArgs);
    } else if(action === 'message' || action === 'messages') {
        return await processMessages(client, message, actionArgs);
    } else if(action === 'emoji') {
        return processEmoji(client, actionArgs);
    } else if(action === 'get') {
        return getOrder(actionArgs[0], actionArgs[1] as keyof Order);
    } else if(action === 'update') {
        return await updateStore(client, message);
    } else if(action === 'settings') {
        return changeSettings(actionArgs);
    } else if(action === 'user') {
        return getUserOrders(client, actionArgs[0]);
    }

    return false;
}

async function getDiscount(message: AssistantMessage, guild: string, roleDiscount: number): Promise<number> {
    const userID = message.author.id;
    const orders = await store.getOrdersByUser(userID);

    const firstTimeDiscount = parseInt(await store.get('conf', 'first_buy_amount') as string);

    if(!orders && firstTimeDiscount) {
        return firstTimeDiscount;
    }

    const discounts = (await store.get('discounts')) || {};

    const discount = (Object.entries<string>(discounts))
        .find(([name]) => guild && name.toLowerCase().includes(guild.toLowerCase()));

    return parseInt((discount || [null, '0'])[1]) + roleDiscount;
}

async function deleteMessage(message: AssistantMessage): Promise<void> {
    try {
        await message.delete();
        // eslint-disable-next-line no-empty
    } catch {}
}

function encode(query: string): string {
    return encodeURI(query)
        .replace('&', '%26')
        .replace('#', '%23')
        .replace('#', '%24');
}

async function getConversion(discount: number): Promise<number> {
    return parseInt(await store.get('conf', 'conversion') as string) - discount;
}

async function getRoleDiscount(client: Assistant, message: AssistantMessage): Promise<number> {
    const dealersGuild = client.guilds.cache.get(client.config.dealers.guildID);

    if(!dealersGuild) {
        return 0;
    }

    try {
        const user = await dealersGuild.members.fetch(message.author.id);

        const roles = client.config.dealers.roles;

        const userRole = roles.find(([id]) => {
            return user.roles.cache.has(id);
        });

        if(!userRole) {
            return 0;
        }

        return userRole[2];
    } catch {
        return 0;
    }
}

// WTB 4x "Crowns Summerset" 3000 crowns для UserID: @etozhegdvs /AVEM

type OrderOptions = {
    discount: number;
}

async function getProducts(
    client: Assistant,
    message: AssistantMessage,
    query: string,
    { discount }: OrderOptions
) {
    const amountMatch = /\d+[xх]/.exec(query);
    const amount = amountMatch ? parseInt(amountMatch[0].trim()) : 1;

    const possibleName = query
        .replace(amountMatch ? amountMatch[0].trim() : '', '')
        .trim();

    const path = `/store?name=${encode(possibleName)}&id=${(message.guild || message.author).id}`;
    const { data } = await client.request(path, null, '1.0.0');

    if(!data.length) {
        const embed = new Embed({
            color: 'error',
            description: `Не удалось найти товар по запросу «${possibleName}». Пожалуйста, введите стоимость товара в кронах.`
        }).setFooter(`Запрос «${possibleName}»`);

        const result = await client.awaitReply(message, embed, 60000 * 60, true);

        // if(result === 'BOT_INTERRUPT') {
        //     throw new ClientError(
        //         'Оформление предыдущего заказа прервано новым заказом.',
        //         '',
        //         message.author
        //     );
        // }

        if(!result) {
            throw new ClientError(`Ваша заявка «${possibleName}» отменена.`, '', message.author);
        }

        const price = parseInt(result.replace(/(\s|,|\.)/g, ''));

        if(isNaN(price)) {
            throw new ClientError('Можно вводить только числа. Пожалуйста, оформите заявку заново.', '', message.author);
        }

        const conversion = await getConversion(discount);

        const crown_price = price * amount;
        const gold_price = crown_price * conversion;

        if(crown_price === 0) {
            throw new ClientError('Товар не может быть бесплатным.', '', message.author);
        }

        return {
            name: possibleName,
            link: '',
            image: '',
            crown_price,
            gold_price,
            amount
        };
    }

    if(data.length > 10) {
        const errorMessage = `По запросу «${possibleName}» найдено слишком много совпадений. Постарайтесь сузить запрос.`;

        throw new ClientError(errorMessage, '', message.author);
    }

    let name = '';
    let cost = 0;
    let image = '';
    let link = '';

    if(data.length > 1) {
        const embed = new Embed({
            color: 'help',
            title: `По вашему запросу нашлось ${data.length.pluralize(['совпадение', 'совпадения', 'совпадений'], 'ru')}`,
            description: 'Введите цифру, под которым обозначен предмет.\n' +
                data.map(({ ru, en }: { ru: string; en: string }, i: number) => `• ${i + 1}. ${ru}${ru !== en ? ` (${en})` : ''}`).join('\n')
        }).setFooter(`Запрос «${possibleName}»`);

        const result = await client.awaitReply(message, embed, 60000 * 60, true);

        // if(result === 'BOT_INTERRUPT') {
        //     throw new ClientError(
        //         'Оформление предыдущего заказа прервано новым заказом.',
        //         '',
        //         message.author
        //     );
        // }

        if(!result) {
            throw new ClientError(
                'Заказ отменен.',
                '',
                message.author
            );
        }

        const item = data.find((_: unknown, i: number) => result === `${i + 1}`);

        if(!item) {
            throw new ClientError('Простите, но по вашему запросу ничего не найдено! Попробуйте еще раз.', '', message.author);
        }

        name = item.ru;
        cost = item.price;
        image = item.image;
        link = item.link;
    } else {
        const item = data[0];

        name = item.ru;
        cost = item.price;
        image = item.image;
        link = item.link;
    }

    const conversion = await getConversion(discount);

    const crown_price = cost * amount;
    const gold_price = crown_price * conversion;

    return {
        name,
        link: ESO_URL + link,
        image,
        crown_price,
        gold_price,
        amount
    };
}

async function run(
    client: Assistant,
    message: AssistantMessage,
    _: RequestInfo,
    args: string []
): Promise<void | false> {
    if(args[0] === 'conf') {
        const result = await configure(client, message, args);

        if(result instanceof Embed || typeof result === 'string') {
            await message.channel.send(result);
        }

        return;
    }

    if(args[0] === 'show') {
        await showOrders(message);

        return;
    }

    await deleteMessage(message);

    let query = args.join(' ').replace(/(^[\s\u200b]*|[\s\u200b]*$)/g, '');

    const discordUserMatch = /<@!?(\d+)>/.exec(query);

    if(discordUserMatch) {
        const discordUser = await (message.guild && message.guild.members.fetch(discordUserMatch[1]));

        query = query.replace(discordUserMatch[0], '@' + (discordUser ? discordUser.user.username : message.author.username));
    }

    const userMatch = /@[\w_\-\s\d'`\.\P{Mark}]+/gu.exec(query);

    if(!userMatch) {
        throw new ClientError('Не найден @userID. Убедитесь, что вы указали свой ник после символа "@".', '', message.author);
    }

    const user = userMatch[0];

    const discountMatch = /\/([\w\s`'".()]+)$/.exec(query);
    const discountGuild = discountMatch ? discountMatch[1].trim() : '';

    const possibleName = query
        .replace('<' + user + '>', '')
        .replace(user, '')
        .replace(discountMatch ? discountMatch[0] : '', '')
        .trim();

    const discountStatus = await store.get('discount_status');
    const discountRole = await getRoleDiscount(client, message);
    const discount = discountStatus ? await getDiscount(message, discountGuild, discountRole) : 0;

    const products = [];

    const plusSplited = possibleName.split('+').filter(Boolean);
    const nlSplited = possibleName.split('\n').filter(Boolean);

    const items = plusSplited.length > nlSplited.length ? plusSplited : nlSplited;

    if(!items.length) {
        throw new ClientError('Не удалось обнаружить товары в вашей заявке.', '', message.author);
    }

    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for(const name of items) {
        const product = await getProducts(client, message, name, { discount });

        products.push(product);
    }

    const conversion = await getConversion(discount);
    const CONFIRM = (await store.get('messages', 'confirm')) + '\nВведите «`+`» для подтверждения.\nЧтобы отменить заказ, введите «`-`».';

    const crown_price = products.reduce((sum, { crown_price }) => sum + crown_price, 0);
    const gold_price = products.reduce((sum, { gold_price }) => sum + gold_price, 0);

    const order = {
        products,
        conversion,
        discount,
        crown_price: new Intl.NumberFormat('ru-RU').format(crown_price),
        gold_price: new Intl.NumberFormat('ru-RU').format(gold_price),
        name: products.map(({ name, amount }) => (amount > 1 ? amount + 'x ' : '') + name).join(', '),
        guild: discountGuild || 'нет',
        message: query,
        user,
        userID: message.author.id,
        status: 'in_moderation',
        seller: null,
        sellerID: null,
        source: message.guild ? message.guild.name : 'Личные сообщения',
        lifecycle: [
            ['in_moderation', message.author.id, new Date().valueOf()] as Lifecycle
        ]
    };

    const embed = new Embed({
        title: 'Подтверждение заказа',
        color: 'help',
        description: CONFIRM.render({ ...order }),
        image: products.length === 1 ? (products[0].image || null) : null
    }).setFooter(`Покупатель: ${user}`, message.author.avatarURL() || message.author.defaultAvatarURL);

    const reply = await client.awaitReply(message, embed, 60000 * 60, true, true);

    if(reply === 'BOT_INTERRUPT') {
        return;
    }

    if(!reply || !/да|yes|\+/i.exec(reply)) {
        await message.author.send(new Embed({
            color: 'error',
            description: 'Покупка отменена.'
        }));

        return;
    }

    const mng_channel = client.channels.cache.get(client.config.dealers.managerChannelID)! as TextChannel;

    const ORDER_DESCRIPTION = await store.get('messages', 'order_description');

    const managerMessage = new Embed({
        title: `${message.author.tag} делает заказ`,
        color: 'help',
        description: ORDER_DESCRIPTION.render(order),
    })
        .setFooter(`Покупатель: ${user}`, message.author.avatarURL() || message.author.defaultAvatarURL);

    try {
        const orderMessage = await mng_channel.send(managerMessage);

        const edited = managerMessage
            .setFooter(`Покупатель: ${user}. Заявка: ${orderMessage.id}`, message.author.avatarURL() || message.author.defaultAvatarURL);

        orderMessage.edit(edited);

        await store.createOrder({ ...order, orderID: orderMessage.id });

        const ORDER_CONFIRMED = await store.get('messages', 'order_confirmed');

        await message.author.send(new Embed({
            color: 'help',
            description: ORDER_CONFIRMED.render({ ...order, orderID: orderMessage.id })
        }));
    } catch(err) {
        client.logger.error('SellerOrdersError', err.message, err.stack);
    }

}

const conf: Configuration = {
    enabled: true,
    guildOnly: false,
    helpShown: false,
    permLevel: 'User',
};

export { run, conf };
