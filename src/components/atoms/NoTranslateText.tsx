import type { ComponentPropsWithoutRef, ElementType } from 'react';

type NoTranslateTextProps<T extends ElementType = 'span'> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'translate'>;

export default function NoTranslateText<T extends ElementType = 'span'>({
  as,
  className,
  ...props
}: NoTranslateTextProps<T>) {
  const Component = (as ?? 'span') as ElementType;
  const nextClassName = className === undefined ? 'notranslate' : `notranslate ${className}`;

  return <Component translate="no" className={nextClassName} {...props} />;
}
