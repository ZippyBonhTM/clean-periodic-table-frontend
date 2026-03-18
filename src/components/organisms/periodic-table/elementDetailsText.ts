const GENERIC_ELEMENT_IMAGE_PATH = '/s/transactinoid.png';

type NullableValueTextOptions = {
  fallbackText?: string;
  yesText?: string;
  noText?: string;
};

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

export function formatNullableValue(
  value: unknown,
  options: NullableValueTextOptions | string = 'Not informed',
): string {
  const {
    fallbackText = 'Not informed',
    yesText = 'Yes',
    noText = 'No',
  } = typeof options === 'string' ? { fallbackText: options } : options;

  if (value === null || value === undefined) {
    return fallbackText;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return fallbackText;
    }

    return trimmedValue;
  }

  if (typeof value === 'boolean') {
    return value ? yesText : noText;
  }

  if (typeof value === 'object') {
    return fallbackText;
  }

  return String(value);
}
