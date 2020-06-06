// Команда "ПЕРЕВОД" присылает перевод строки из глоссария RuESO. У команды есть
// несколько ключевых слов, которые они не использует в поиске (названия таблиц,
// в которых искать).

const Discord = require("discord.js");
const rp = require("request-promise"); // Позволяет отправлять запрос по ссылке
const errors = require("request-promise/errors");

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  if (!args[0]) {
    const help = new Discord.RichEmbed()
      .setColor(client.colors.translate)
      .setThumbnail(client.media.magnifier)
      .setTitle("Справка по команде «перевод»")
      .setDescription("Присылает перевод строки из [глоссария RuESO](https://elderscrolls.net/tes-online/rueso-glossary/) в соответствии с указанным запросом.")
      .addField("Использование", `${message.settings.prefix}перевод [запрос]\n${message.settings.prefix}перевод [категория] [запрос]`)
      .addField("Синтаксис", "Команда использует ключевые слова, чтобы вывести результаты в нужной категории:\n• **Персонажи** — нип, нпс, персонаж, npc;\n• **Локации** — лока, локация;\n• **Предметы** — предмет, итем;\n• **Задания** — задание, квест;\n• **Достижения** — достижение, ачивка.\n• **Коллекционные предметы** — коллекционные, коллекционки, колл.\nНапример, команда `-перевод нип Mage` выведет список персонажей, в которых встречается слово Mage.");
    
    return message.channel.send(help);
  }
  let querry = args.join(" "); // Запрос.
  if (querry.length < 4) return message.channel.send("Пожалуйста, введите запрос длиной больше 3 символов.");
  
  // Объект с информацией о таблицах.
  const tables = {"Достижение": {plural: "Достижения", aliases: ["достижение", "Достижение", "достижения", "Достижения", "ачивка"]}, "Квест": {plural: "Задания", aliases: ["задание", "квест", "Квест", "задания", "квесты", "Квесты"]}, 
    "Предмет": {plural: "Предметы", aliases: ["предмет", "Предмет", "итем", "предметы", "Предметы", "итемы"]}, "NPC": {plural: "Персонажи", aliases: ["нип", "нпс", "персонаж", "NPC", "НИП", "нипы", "персонажи", "НИПЫ"]}, 
    "Локация": {plural: "Локации", aliases: ["лока", "локация", "Локация", "локи", "локации", "Локации"]}, "Коллекционный предмет": {plural: "Коллекционные предметы", aliases: ["коллекционные", "коллекционки", "коллекционка", "колл"]}};
  let table, exit = true, arg_count = 0; // Название таблицы, параметр выхода из поиска таблицы и индекс в аргументах.
    
  // Ищет, есть ли в запросе название таблицы. Если есть, то хранит информацию о
  // ней в переменной table и удаляет из запроса.
  while (arg_count < args.length && exit) {
    for (const t_name in tables) {
      if (tables[t_name].aliases.includes(args[arg_count]) && exit) {
        table = t_name;
        querry = querry.replace(`${args[arg_count]} `, "").replace(` ${args[arg_count]}`, "");
        args.splice(arg_count,arg_count+1);
        if (args.length === 0) table = undefined;
        exit = false;
      }
    }
    arg_count++;
  }
  
  // Если после удаления таблицы, в запросе меньше 4 символов, просит ввести другой запрос.
  if (querry.length < 4) return message.channel.send("Пожалуйста, введите запрос длиной больше 3 символов (не считая категории)."); 
  
  // Ссылка, читаемая браузером (все русские символы кодирует).
  const encoded_querry = encodeURI(querry).replace("&","%26").replace("#","%23").replace("#","%24"); 
  rp(`http://ruesoportal.elderscrolls.net/ESOBase/searchservlet/?searchtext=${encoded_querry}`).then(function(body) {
    if (body === "parseResponse([]);" && !table) return message.channel.send(`К сожалению, по запросу «${querry}» ничего не найдено.`);
    if (body === "parseResponse([]);" && table) return message.channel.send(`К сожалению, по запросу «${querry}» в таблице «${tables[table].plural}» ничего не найдено.`);

    const result = JSON.parse(body.replace("parseResponse(","").replace(");","")); // Парсит страницу.

    const max_q = 15;
    let true_q = 0;
    let m = 0;
    let k = 0;

    const all_by_cats = {}; // Все переводы, отсортированные по таблицам.
    const skip = [undefined, "Описание способности", "Описание коллекционного предмета"]; // Пропускать следующие таблицы. undefined на всякий случай.

    // Добавляет все переводы по таблицам. При этом пропускает те, что указаны в skip.
    result
      .filter(t => { if (!skip.includes(t.tableName) && t.textRu !== t.textEn && t.textEn.search(/<<[\w:]{0,}\d>>/) === -1) return t.tableName; })
      .reduce((lastRu, e) => {
        if (!all_by_cats[e.tableName]) all_by_cats[e.tableName] = {};
        if (!all_by_cats[e.tableName].array) all_by_cats[e.tableName].array = [];
        if (!all_by_cats[e.tableName].count)all_by_cats[e.tableName].count = 0;

        if (e.textRu === lastRu) return e.textRu;

        all_by_cats[e.tableName].array.push(`• **${e.textRu.capitalize().replace("<<player{","").replace("}>>","").replace(/\^\w+$/,"")}** (${e.textEn.replace("<<player{","").replace("}>>","").replace(/\^\w+$/,"")})`);
        all_by_cats[e.tableName].count++;
        true_q++;
        return e.textRu;
      }, "");
    
    // Если в целом есть найденные переводы, но они в таблицах skip, то выводит сообщение, что ничего не нашлось.
    if (true_q === 0 && !table) return message.channel.send(`К сожалению, по запросу «${querry}» ничего не найдено.`);
    else if (true_q === 0 && table) return message.channel.send(`К сожалению, по запросу «${querry}» в таблице «${tables[table].plural}» ничего не найдено.`);
    
    // Если указана таблица и есть, что выводить.
    if (table && all_by_cats[table] && all_by_cats[table].count && all_by_cats[table].count > 0) {    
      const embed = new Discord.RichEmbed()
        .setColor(client.colors.translate)
        .setThumbnail(client.media.magnifier)
        .setTitle(`Результаты по запросу «${querry}»`)
        .setURL("https://elderscrolls.net/tes-online/rueso-glossary/")
        .setDescription(`По вашему запросу было найдено ${all_by_cats[table].count.declOfNum(["совпадение", "совпадения", "совпадений"])} (во всех таблицах найдено ${true_q.declOfNum(["совпадение", "совпадения", "совпадений"])}).`);
      
      // Красиво оформляет дальше.
      const result = [];

      while (m < max_q && k < max_q) {	
        if (all_by_cats[table].array && all_by_cats[table].array[m]) {
          result.push(all_by_cats[table].array[m]);
          k++;
        }
        if (result.join("\n").length > 1023) { // Если количество символов превышает доступное, то удаляет последнее вхождение.
          result.pop();
          k--;
        }
        m++;
      }

      embed.addField(tables[table].plural, result.join("\n")); // Склеивает всё.

      if (all_by_cats[table].count > 15) embed.setDescription(`Показано ${k.declOfNum(["совпадение", "совпадения", "совпадений"])} из ${all_by_cats[table].count} (во всех таблицах найдено ${true_q.declOfNum(["совпадение", "совпадения", "совпадений"])}). Уточните запрос или воспользуйтесь поиском по [ссылке](https://elderscrolls.net/tes-online/rueso-glossary/).`);

      return message.channel.send(embed);
    } else if (table && !all_by_cats[table]) { // Если указана таблица, но ничего не нашлось (такоен возможно в двух случаях — массив или вообще не создастся или создастся пустым).
      return message.channel.send(`К сожалению, в таблице «${tables[table].plural}» по запросу «${querry}» ничего не найдено.`);
    } else if (table && all_by_cats[table] && all_by_cats[table].array && all_by_cats[table].array.length === 0) {
      return message.channel.send(`К сожалению, в таблице «${tables[table].plural}» по запросу «${querry}» ничего не найдено.`);
    }

    // Если не указана таблица, то выводи всё.
    const embed = new Discord.RichEmbed()
      .setColor(client.colors.translate)
      .setThumbnail(client.media.magnifier)
      .setTitle(`Результаты по запросу «${querry}»`)
      .setURL("https://elderscrolls.net/tes-online/rueso-glossary/")
      .setDescription(`По вашему запросу было найдено ${true_q.declOfNum(["совпадение", "совпадения", "совпадений"])}.`);

    const finalResult = {};

    while (m < max_q && k < max_q) {	
      for (const key in all_by_cats) {
        if (!finalResult[key]) finalResult[key] = [];
        if (all_by_cats[key].array[m]) {
          finalResult[key].push(all_by_cats[key].array[m]);					
          k++;
        }
        if (finalResult[key].join("\n").length > 1023) { // Если количество символов превышает доступное, то удаляет последнее вхождение.
          finalResult[key].pop();
          k--;
        }
        if (finalResult[key].length === 0) delete finalResult[key];
      }
      m++;
    }
    
    for (const type in finalResult) {
      embed.addField(`${tables[type].plural} (${all_by_cats[type].count})`, finalResult[type].join("\n"));
    }      
    
    // Показывает максимум 20 совпадений, поэтому если найдено больше 15, то так и пишет.
    if (true_q > 15) embed.setDescription(`Показано ${k.declOfNum(["совпадение", "совпадения", "совпадений"])} из ${true_q}. Уточните запрос или воспользуйтесь поиском по [ссылке](https://elderscrolls.net/tes-online/rueso-glossary/).`);

    return message.channel.send(embed);
  }).catch(errors.TransformError, reason => {
    message.channel.send("Недопустимый запрос.");
    return client.logger.error(`Ошибка при подключении к базе данных RuESO: ${reason.cause.message}`);
  });
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  helpShown: true,
  aliases: ["translate"],
  permLevel: "Пользователь"
};

exports.help = {
  name: "перевод",
  category: "Информация о ESO",
  description: "Присылает перевод из RuESO в соответствии с запросом.",
  usage: "перевод [запрос]"
};
