
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  actionOnClick?: () => void; // Added this prop to support both naming styles
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  actionOnClick
}: EmptyStateProps) {
  // Use onAction or actionOnClick, with actionOnClick taking precedence
  const handleAction = actionOnClick || onAction;
  const isMobile = useIsMobile();
  
  return (
    <div className="text-center p-6 md:p-12 bg-card rounded-lg">
      <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 mb-4">
        <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
      </div>
      <h3 className="text-base md:text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && (
        <Button onClick={handleAction} asChild={!!actionHref} size={isMobile ? "sm" : "default"}>
          {actionHref ? <a href={actionHref}>{actionLabel}</a> : actionLabel}
        </Button>
      )}
    </div>
  );
}
