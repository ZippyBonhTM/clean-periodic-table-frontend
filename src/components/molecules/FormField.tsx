import { memo } from 'react';

import Input from '@/components/atoms/Input';

type FormFieldProps = {
  id: string;
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
};

function FormField({
  id,
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
      />
    </div>
  );
}

export default memo(FormField);
