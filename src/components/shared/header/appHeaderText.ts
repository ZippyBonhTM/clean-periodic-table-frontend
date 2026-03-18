import { appHeaderTextEn } from '@/components/shared/header/appHeaderText.en';
import { appHeaderTextPt } from '@/components/shared/header/appHeaderText.pt';
import type {
  AppHeaderNavBadgeKey,
  AppHeaderNavLinkKey,
} from '@/components/shared/header/appHeader.types';
import type { TokenStatusType } from '@/components/molecules/TokenStatus';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const APP_HEADER_TEXT_BY_LOCALE = {
  'en-US': appHeaderTextEn,
  'pt-BR': appHeaderTextPt,
} as const;

type WidenAppHeaderTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenAppHeaderTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenAppHeaderTextLiterals<T[Key]> }
        : T;

export type AppHeaderTextCatalog = WidenAppHeaderTextLiterals<typeof appHeaderTextEn>;

export function getAppHeaderText(locale: AppLocale): AppHeaderTextCatalog {
  return APP_HEADER_TEXT_BY_LOCALE[locale];
}

export function getAppHeaderNavLabel(
  text: AppHeaderTextCatalog,
  key: AppHeaderNavLinkKey,
): string {
  return text.navigation.links[key];
}

export function getAppHeaderNavBadge(
  text: AppHeaderTextCatalog,
  key?: AppHeaderNavBadgeKey,
): string | undefined {
  if (key === undefined) {
    return undefined;
  }

  return text.navigation.badges[key];
}

export function getTokenStatusLabel(
  text: AppHeaderTextCatalog,
  status: TokenStatusType,
): string {
  return text.tokenStatus[status];
}
