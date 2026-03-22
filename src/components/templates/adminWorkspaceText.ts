import { adminWorkspaceTextEn } from '@/components/templates/adminWorkspaceText.en';
import { adminWorkspaceTextPt } from '@/components/templates/adminWorkspaceText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ADMIN_WORKSPACE_TEXT_BY_LOCALE = {
  'en-US': adminWorkspaceTextEn,
  'pt-BR': adminWorkspaceTextPt,
} as const;

type WidenAdminWorkspaceTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenAdminWorkspaceTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenAdminWorkspaceTextLiterals<T[Key]> }
        : T;

export type AdminWorkspaceTextCatalog =
  WidenAdminWorkspaceTextLiterals<typeof adminWorkspaceTextEn>;

export function getAdminWorkspaceText(locale: AppLocale): AdminWorkspaceTextCatalog {
  return ADMIN_WORKSPACE_TEXT_BY_LOCALE[locale];
}
