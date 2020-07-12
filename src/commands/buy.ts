// // Команда "ПРЕФИКС" позволяет изменять префикс бота в ЛС или на сервере.

// const Embed = require( '../helpers/embed' );

// const { ClientError } = require( '../modules/error' );

// const MANAGERS_CHANNEL_ID = '556096313968689173';

// //  у менеджеров есть команды какие эмоджи што отправляют

// exports.run = async ( client, message, _, [name = '', user = '']) => {
//     if( !name ) {
//         return false;
//     }

//     if( !user ) {
//         throw new ClientError( 'Укажите свой игровой UserID!', null, message.channel );
//     }

//     const reply = await client.awaitReply( message, `Пожалуйста, подтвердите операцию! Вы хотите купить ${name} (1000 крон) за 1000 золотых (конверсия 1/1)? (Да/Нет)` );

//     if( !reply || reply === 'Нет' ) {
//         return message.channel.send( 'Операция отменена.' );
//     }

//     const mng_channel = client.channels.cache.get( MANAGERS_CHANNEL_ID );

//     mng_channel.send( `${user} заказал ${name} (1000 крон) за 1000 золотых (конверсия 1/1).` )
//         .then( message => {
//             // const collector = message.createReactionCollector( () => true );

//             // collector.on( 'collect', reaction => {
//             //     console.log( `Collected ${reaction.emoji.name}` );
//             // });

//             message.fetch();
//         })
//         .catch( client.logger.error );

//     return message.channel.send( 'Ваш заказ принят!' );
// };

// exports.conf = {
//     enabled: true,
//     guildOnly: false,
//     helpShown: true,
//     permLevel: 'User'
// };

import { Configuration } from '../types';

async function run(): Promise<true> {
    console.log('buy launched');
    return true;
}

const conf: Configuration = {
    enabled: false,
    guildOnly: false,
    helpShown: true,
    permLevel: 'User',
};

export { run, conf };
