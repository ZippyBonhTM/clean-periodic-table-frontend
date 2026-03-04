'use client';

import { memo } from 'react';

type InputProps = {
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
};

function Input({
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
  required = false,
}: InputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete={autoComplete}
      required={required}
      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)]"
    />
  );
}

export default memo(Input);
