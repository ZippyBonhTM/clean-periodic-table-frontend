import { articleAccessRecoveryTextEn } from '@/components/templates/articleAccessRecoveryText.en';
import { articleAccessRecoveryTextPt } from '@/components/templates/articleAccessRecoveryText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

export function getArticleAccessRecoveryText(locale: AppLocale) {
  return locale === 'pt-BR' ? articleAccessRecoveryTextPt : articleAccessRecoveryTextEn;
}
