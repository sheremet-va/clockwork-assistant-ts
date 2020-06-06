const translate = (
    translations: Record<string, Record<string, string>>,
    language: string
): Record<string, string> => {
    return Object.entries(translations)
        .reduce((final, [key, translation]) => ({
            ...final,
            [key]: translation[language]
        }), {});
};

export { translate };