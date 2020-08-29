import Enmap from 'enmap';

const homedir = require('os').homedir();

const store = new Enmap({
    name: 'store',
    dataDir: homedir + '/ca-data'
});

store.ensure('messages', {});
store.ensure('messages', 'Ваш заказ с номером {{orderID}} на «{{name}}» принят! Перешлите @{{seller}} {{gold_price}} золотых по внутри-игровой почте.', 'accepted');
store.ensure('messages', '@{{seller}} получает золото за «{{name}}». Ожидайте подарок.', 'gold_received');
store.ensure('messages', 'Подарок отправлен! Ваш заказ на «{{name}}» выполнен.', 'gift_sent');
store.ensure('messages', 'К сожалению, ваш заказ был отклонен менеджером.', 'canceled');

store.ensure('discounts', {});
store.ensure('discount_status', true);
store.ensure('managers', ['215358861647806464:Fellorion']);
store.ensure('emojis', {
    accepted: 'kajiit_dealer',
    gold_received: 'kajiit_bankeer',
    gift_sent: 'skooma',
    canceled: '❌'
});

store.ensure('conf', {
    user_sent_gold_status: 'accepted',
    order_completed_status: 'gift_sent',

    conversion: 400
});

store.ensure('messages', '{{user}} заказывает «{{name}}» ({{crown_price}} крон) за {{gold_price}} золотых (конверсия {{conversion}}/1). Гильдия: {{guild}}. Источник: {{source}}.', 'order_description');
store.ensure('messages', 'Ваш заказ принят! Бот напишет вам данные для перевода, как только менеджер подтвердит заказ.', 'order_confirmed');
store.ensure('messages', 'Заказ для «{{user}}» выполнен', 'order_done_title');
store.ensure('messages', '{{seller}} успешно выполняет заказ. {{user}} наслаждается своим новым подарком - «{{name}}»!', 'order_done_description');
store.ensure('messages', 'Покупатель {{user}} отправил золото на игровой ник @{{seller}} за предмет «{{name}}» (номер заказа: {{orderID}}).', 'user_sent_gold');
store.ensure('messages', 'Пожалуйста, подтвердите заказ! Вы хотите купить «{{name}}» ({{crown_price}} крон) за {{gold_price}} золотых (конверсия {{conversion}}/1)?', 'confirm');

export { store };
