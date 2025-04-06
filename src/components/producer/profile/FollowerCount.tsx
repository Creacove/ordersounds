
import { User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';

interface FollowerCountProps {
  count: number;
  className?: string;
}

export function FollowerCount({ count, className = '' }: FollowerCountProps) {
  const [displayCount, setDisplayCount] = useState(count);
  
  // Format large numbers
  const formatCount = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  useEffect(() => {
    setDisplayCount(count);
  }, [count]);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${className}`}>
            <User size={14} />
            <span className="font-medium">{formatCount(displayCount)}</span>
            <span className="text-muted-foreground">follower{displayCount !== 1 ? 's' : ''}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{count.toLocaleString()} follower{count !== 1 ? 's' : ''}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
