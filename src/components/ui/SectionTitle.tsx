
import React from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  className 
}) => {
  return (
    <h2 className={cn("text-lg md:text-xl font-bold tracking-tight mb-4", className)}>
      {children}
    </h2>
  );
};
