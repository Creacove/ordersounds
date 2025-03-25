
import React from 'react';
import { Beat } from '@/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ListMusic, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueuePopoverProps {
  queue: Beat[];
  clearQueue: () => void;
  removeFromQueue: (beatId: string) => void;
}

export function QueuePopover({ queue, clearQueue, removeFromQueue }: QueuePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-7 w-7 md:h-8 md:w-8",
            queue.length > 0 && "text-primary"
          )}
        >
          <ListMusic size={16} className="md:size-18" />
          {queue.length > 0 && (
            <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center">
              {queue.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 md:w-80 p-0" align="end">
        <div className="p-2 border-b border-border flex justify-between items-center">
          <h4 className="font-medium text-sm">Queue ({queue.length})</h4>
          {queue.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearQueue}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
        {queue.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Your queue is empty
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {queue.map((beat) => (
              <div 
                key={beat.id} 
                className="flex items-center gap-2 p-2 hover:bg-muted/50"
              >
                <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={beat.cover_image_url || '/placeholder.svg'}
                    alt={beat.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="text-sm truncate">{beat.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{beat.producer_name}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-70 hover:opacity-100" 
                  onClick={() => removeFromQueue(beat.id)}
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
