import { articleEditorTextEn } from '@/components/templates/articleEditorText.en';
import { articleEditorTextPt } from '@/components/templates/articleEditorText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ARTICLE_EDITOR_TEXT_BY_LOCALE = {
  'en-US': articleEditorTextEn,
  'pt-BR': articleEditorTextPt,
} as const;

type WidenArticleEditorTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenArticleEditorTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenArticleEditorTextLiterals<T[Key]> }
        : T;

export type ArticleEditorTextCatalog = WidenArticleEditorTextLiterals<typeof articleEditorTextEn>;

export function getArticleEditorText(locale: AppLocale): ArticleEditorTextCatalog {
  return ARTICLE_EDITOR_TEXT_BY_LOCALE[locale];
}

