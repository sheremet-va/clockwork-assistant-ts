export default (client: Assistant, error: Error): void => {
    client.logger.error('DiscordError', JSON.stringify(error));
};
