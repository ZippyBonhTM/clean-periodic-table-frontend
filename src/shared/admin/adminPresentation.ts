import type { AdminUserAccountStatus, AdminUserAccountVersion } from '@/shared/types/admin';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

function formatAdminDateTime(locale: AppLocale, value: string | null): string {
  if (value === null) {
    return '—';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function resolveAdminUserStatusClass(status: AdminUserAccountStatus): string {
  if (status === 'active') {
    return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-50';
  }

  if (status === 'restricted') {
    return 'border-amber-400/35 bg-amber-400/10 text-amber-50';
  }

  return 'border-rose-400/35 bg-rose-400/10 text-rose-50';
}

function resolveAdminAuditActionClass(action: string): string {
  if (action === 'role_change') {
    return 'border-sky-400/35 bg-sky-400/10 text-sky-50';
  }

  if (action === 'moderation') {
    return 'border-amber-400/35 bg-amber-400/10 text-amber-50';
  }

  if (action === 'session_revoke') {
    return 'border-rose-400/35 bg-rose-400/10 text-rose-50';
  }

  if (action === 'directory_sync') {
    return 'border-violet-400/35 bg-violet-400/10 text-violet-50';
  }

  return 'border-slate-400/25 bg-slate-400/10 text-slate-100';
}

function resolveAdminUserVersionClass(version: AdminUserAccountVersion): string {
  if (version === 'product-v1') {
    return 'border-sky-400/35 bg-sky-400/10 text-sky-50';
  }

  return 'border-fuchsia-400/35 bg-fuchsia-400/10 text-fuchsia-50';
}

export {
  formatAdminDateTime,
  resolveAdminAuditActionClass,
  resolveAdminUserStatusClass,
  resolveAdminUserVersionClass,
};
