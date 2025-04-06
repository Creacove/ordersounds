
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface FollowButtonProps {
  producerId: string;
  initialFollowState?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function FollowButton({
  producerId,
  initialFollowState,
  onFollowChange,
  size = 'default',
  variant = 'default',
  className = '',
}: FollowButtonProps) {
  const { user } = useAuth();
  const { useFollowStatus, toggleFollow } = useFollows();
  const { data: isFollowing, isLoading: isStatusLoading } = useFollowStatus(producerId);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use initialFollowState if provided and isFollowing is not loaded yet
  const followState = isFollowing ?? initialFollowState ?? false;
  
  const handleFollowToggle = async () => {
    if (!user) {
      toast.error('Please sign in to follow this producer');
      return;
    }
    
    // Remove the restriction for producers
    // Now producers can follow other producers
    
    setIsLoading(true);
    try {
      const result = await toggleFollow(producerId, followState);
      if (result && onFollowChange) {
        onFollowChange(!followState);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      onClick={handleFollowToggle}
      size={size}
      variant={followState ? 'secondary' : variant}
      disabled={isLoading || isStatusLoading}
      className={className}
    >
      {isLoading ? 'Loading...' : (followState ? 'Following' : 'Follow')}
    </Button>
  );
}
