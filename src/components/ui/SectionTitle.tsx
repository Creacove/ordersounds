
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SectionTitleProps {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  badge?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  title, 
  icon,
  badge,
  className 
}) => {
  return (
    <div className={cn("flex items-center gap-2 mb-4", className)}>
      <h2 className="text-lg md:text-xl font-bold tracking-tight">
        {icon && <span className="mr-2 inline-flex">{icon}</span>}
        {title}
      </h2>
      {badge && (
        <Badge variant="secondary" className="bg-amber-600/20 text-amber-500 hover:bg-amber-600/30 px-2">
          {badge}
        </Badge>
      )}
    </div>
  );
};
