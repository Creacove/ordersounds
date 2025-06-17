
import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FileUploadInputProps {
  id: string;
  name: string;
  accept?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  multiple?: boolean;
  'aria-label'?: string;
}

export function FileUploadInput({ 
  id, 
  name, 
  accept, 
  onChange, 
  className, 
  multiple = false,
  'aria-label': ariaLabel,
  ...props 
}: FileUploadInputProps) {
  return (
    <Input
      id={id}
      name={name}
      type="file"
      accept={accept}
      onChange={onChange}
      className={cn("cursor-pointer", className)}
      multiple={multiple}
      aria-label={ariaLabel}
      {...props}
    />
  );
}
