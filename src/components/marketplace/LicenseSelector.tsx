
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LicenseSelectorProps {
  onChange: (value: 'basic' | 'premium' | 'exclusive' | 'custom') => void;
  defaultValue?: 'basic' | 'premium' | 'exclusive' | 'custom';
}

export function LicenseSelector({ onChange, defaultValue = 'basic' }: LicenseSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm opacity-70">License</label>
      <Select 
        defaultValue={defaultValue} 
        onValueChange={(value) => onChange(value as 'basic' | 'premium' | 'exclusive' | 'custom')}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select License" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="basic">Basic License</SelectItem>
          <SelectItem value="premium">Premium License</SelectItem>
          <SelectItem value="exclusive">Exclusive License</SelectItem>
          <SelectItem value="custom">Custom License</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
