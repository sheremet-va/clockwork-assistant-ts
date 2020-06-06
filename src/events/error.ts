export default (client: Assistant, error: Error): void => {
    client.logger.error(`Discord.js отправил ошибку: \n${JSON.stringify(error)}.`);
};
