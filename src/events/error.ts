function event(client: Assistant, error: Error): void {
    client.logger.error('DiscordError', JSON.stringify(error));
}

export { event };
