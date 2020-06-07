export declare type Translations = Record<string, string>;
export declare type SubsTranslations = Record<string, Translations>;

export declare type Complete<T> = {
    [K in keyof T]-?: T[K];
}

function translate(translations: Translations | string, language: string | undefined): string {
    if (typeof translations === 'string') {
        return translations;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return translations[language!] || translations.en || '';
}
function build(
    subject: Record<string, string>,
    type: string,
    template: string | null = null
): string {
    return type.replace(/(\w+)\+(\w+)|(\w+)/, (lang, lang1, lang2) => {
        if(!lang2 && !(lang in subject)) {
            return subject.en;
        }

        if (!lang1) {
            return subject[lang].capitalize();
        }

        if (subject[lang1] !== subject[lang2]) {
            const first = subject[lang1].capitalize();
            const second = subject[lang2];

            return template
                ? template.render({ first, second })
                : `${subject[lang1].capitalize()} (${subject[lang2]})`;
        }

        return subject[lang1].capitalize();
    });
}

function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

function keys<O>(o: O): (keyof O)[] {
    return Object.keys(o) as (keyof O)[];
}

function entries<O>(o: O): ([keyof O, Exclude<O[keyof O], undefined>])[] {
    return Object.entries(o) as ([keyof O, Exclude<O[keyof O], undefined>])[];
}

export { translate, notUndefined, keys, entries, build };