
import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { FollowButton } from "@/components/buttons/FollowButton";
import { FollowerCount } from "@/components/producer/profile/FollowerCount";
import { Producer } from "@/hooks/useProducers";

interface SuggestedProducersProps {
  producers: Producer[];
  onDismiss: (id: string) => void;
  onShuffle: () => void;
}

export function SuggestedProducers({ producers, onDismiss, onShuffle }: SuggestedProducersProps) {
  if (producers.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h2 className="heading-responsive-md">Suggested for you</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onShuffle}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          <span className="whitespace-nowrap">Shuffle Suggestions</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {producers.map((producer) => (
          <div 
            key={producer.id} 
            className="bg-secondary rounded-lg p-4 relative group"
          >
            <button 
              className="absolute top-2 right-2 bg-background/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10" 
              aria-label="Dismiss"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDismiss(producer.id);
              }}
            >
              <X size={16} />
            </button>
            
            <Link to={`/producer/${producer.id}`} className="flex flex-col items-center">
              <Avatar className="h-16 w-16 mb-3">
                <AvatarImage 
                  src={producer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.full_name}`}
                  alt={producer.stage_name || producer.full_name} 
                />
                <AvatarFallback>
                  {(producer.stage_name || producer.full_name || 'P').charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="text-responsive-base font-semibold mb-1 text-center truncate max-w-full">
                {producer.stage_name || producer.full_name}
              </h3>
              
              <div className="text-muted-foreground text-xs mb-3">
                <FollowerCount 
                  count={producer.follower_count || 0} 
                  className="text-xs text-muted-foreground"
                />
              </div>
              
              <FollowButton 
                producerId={producer.id}
                className="w-full"
                size="sm"
                variant="outline"
              />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
