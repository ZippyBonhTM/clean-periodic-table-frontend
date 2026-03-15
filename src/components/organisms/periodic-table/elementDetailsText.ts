const GENERIC_ELEMENT_IMAGE_PATH = '/s/transactinoid.png';

export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export function hasDisplayText(value: unknown): boolean {
  return normalizeText(value).length > 0;
}

export function normalizeElementImageUrl(value: unknown): string {
  const normalized = normalizeText(value);

  if (normalized.length === 0) {
    return '';
  }

  if (normalized.toLowerCase().includes(GENERIC_ELEMENT_IMAGE_PATH)) {
    return '';
  }

  return normalized;
}

export function formatNullableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Not informed';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return 'Not informed';
    }

    return trimmedValue;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return 'Not informed';
  }

  return String(value);
}
