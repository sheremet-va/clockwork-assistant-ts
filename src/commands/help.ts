// // Команда "СПРАВКА" выводит справку о командах бота.

// const Discord = require( 'discord.js' );
// const { version } = require( '../package.json' );

// exports.run = async ( client, message, args, level ) => { // eslint-disable-line no-unused-vars
//     return;
//     // Показывает все команды, если не вызван аргумент.
//     if ( !args[0]) {
//         const myCommands = message.guild ? client.commands.filter( cmd => client.levelCache[cmd.conf.permLevel] <= level && cmd.conf.helpShown !== false ) : client.commands.filter( cmd => client.levelCache[cmd.conf.permLevel] <= 3 && cmd.conf.guildOnly !== true && cmd.conf.helpShown !== false );

//         const commandsByCategories = myCommands.reduce( ( commands, c ) => {
//             if ( !commands[c.help.category]) commands[c.help.category] = [];

//             commands[c.help.category].push( `**${message.settings.prefix + c.help.name}**: ${c.help.description.toLowerFirst()}` );

//             return commands;
//         }, {});

//         const embed = new Discord.RichEmbed()
//             .setAuthor( 'Clockwork Assistant' )
//             .setColor( 0x96D5A9 )
//             .setURL( 'http://online.elderscrolls.net/RuESO_Automaton' )
//             .setDescription( `**Clockwork Assistant ${version}** (by astds#0243). Вся документация на [странице бота](http://online.elderscrolls.net/Clockwork_Assistant) в Имперской библиотеке. Отдельное спасибо команде RuESO за перевод игры. Чтобы узнать подробную справку о команде, введите \`${message.settings.prefix}справка название-команды\`.` );

//         Object.keys( commandsByCategories ).forEach( key => embed.addField( key, commandsByCategories[key].join( '\n' ) ) );

//         return message.channel.send( embed.addField( 'Добавить бота на сервер', '[Нажмите здесь](https://discordapp.com/api/oauth2/authorize?client_id=543021755841642506&permissions=486464&scope=bot)' ) );
//     } else if ( args[0] === 'перевод' ) {
//     // Показывает справку по переводу.
//         const help = new Discord.RichEmbed()
//             .setAuthor( 'Справка по команде «перевод»' )
//             .setColor( client.colors.help )
//             .setThumbnail( client.media.icon )
//             .setDescription( 'Присылает перевод строки из [глоссария RuESO](https://elderscrolls.net/tes-online/rueso-glossary/) в соответствии с указанным запросом.' )
//             .addField( 'Использование', `${message.settings.prefix}перевод [запрос]\n${message.settings.prefix}перевод [категория] [запрос]` )
//             .addField( 'Синтаксис', 'Команда использует ключевые слова, чтобы вывести результаты в нужной категории:\n• **Персонажи** — нип, нпс, персонаж, npc;\n• **Локации** — лока, локация;\n• **Предметы** — предмет, итем;\n• **Задания** — задание, квест;\n• **Достижения** — достижение, ачивка.\n• **Коллекционные предметы** — коллекционные, коллекционки.\n\nНапример, команда `-перевод нип Mage` выведет список персонажей, в которых встречается слово Mage.' );

//         return message.channel.send( help );
//     } else if ( args[0] === 'язык' ) {
//     // Показывает справку по языку.
//         const help = new Discord.RichEmbed()
//             .setAuthor( 'Справка по команде «язык»' )
//             .setColor( client.colors.help )
//             .setThumbnail( client.media.icon )
//             .setDescription( 'Данная команда устанавливает нужный язык, который будет использоваться ботом при выдаче обетов в подписках или вызове команды.\nЧтобы настроить индивидуальный вывод, который будет распространяться на все сервера, достаточно вызвать нужную команду в личных сообщениях с ботом.' )
//             .addField( 'Использование', `${message.settings.prefix}язык обетов [вид]` )
//             .addField( 'Синтаксис', 'На выбор доступно четыре варианта отображения подземелий:\n• ру — на русском языке;\n• англ — на английском языке.;\n• англ-ру — на английском и русском языках.;\n• ру-англ — на русском и английском языках (по-умолчанию).\nНапример, вы хотите, чтобы подземелья сначала выводились по-английски, а затем по-русски. Тогда введите следующую команду: `-язык обетов англ-ру`.' );

//         return message.channel.send( help );
//     }
//     else {
//     // Показывает справку для остальных команд (в зависимости от аргумента).
//         const commandName = args[0];
//         if ( client.commands.has( commandName ) ) {
//             const command = client.commands.get( commandName );
//             if ( level < client.levelCache[command.conf.permLevel]) return;

//             const embed = new Discord.RichEmbed()
//                 .setAuthor( `Справка по команде «${command.help.name}»` )
//                 .setColor( client.colors.help )
//                 .setThumbnail( client.media.icon )
//                 .addField( 'Описание', command.help.description )
//                 .addField( 'Использование', message.settings.prefix + command.help.usage )
//                 .addField( 'Другое написание', message.settings.prefix + command.conf.aliases.join( `, ${message.settings.prefix}` ) );

//             return message.channel.send( embed );
//         }
//     }
// };

// exports.conf = {
//     enabled: true,
//     guildOnly: false,
//     helpShown: true,
//     aliases: ['h', 'help', 'помощь', 'help'],
//     permLevel: 'Пользователь'
// };

// exports.help = {
//     name: 'справка',
//     category: 'Системное',
//     description: 'Отображает все доступные команды.',
//     usage: 'справка [команда]'
// };


import { Configuration } from '../types';

async function run(): Promise<true> {
    console.log('help launched');
    return true;
}

const conf: Configuration = {
    enabled: true,
    guildOnly: false,
    helpShown: true,
    permLevel: 'User',
};

export { run, conf };
