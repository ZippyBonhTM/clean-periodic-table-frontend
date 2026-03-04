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
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-shadow focus:border-teal-600 focus:ring-2 focus:ring-teal-200"
    />
  );
}

export default memo(Input);
