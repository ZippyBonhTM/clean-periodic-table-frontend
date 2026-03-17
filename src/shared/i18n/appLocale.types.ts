export const APP_LOCALES = ['en-US', 'pt-BR'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];
