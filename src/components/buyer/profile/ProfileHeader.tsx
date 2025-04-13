
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, ListMusic, Calendar, Settings, UserPlus, Share2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProfileHeaderProps {
  buyer: Partial<User>;
  playlists: any[];
  isOwnProfile: boolean;
}

export function ProfileHeader({ buyer, playlists, isOwnProfile }: ProfileHeaderProps) {
  const navigate = useNavigate();

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${buyer?.name}'s profile on OrderSOUNDS`,
        url: window.location.href
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Profile link copied to clipboard!'))
        .catch(err => console.error('Error copying to clipboard:', err));
    }
  };
  
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-background h-40 rounded-xl -z-10"></div>
      <div className="flex flex-col md:flex-row gap-6 pt-6 mb-8">
        <div className="flex-shrink-0 md:ml-6">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-xl">
            <AvatarImage src={buyer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${buyer.name}`} />
            <AvatarFallback className="bg-purple-600 text-2xl">
              {(buyer.name || 'U').charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1 md:mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {buyer.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mb-4">
                {buyer.country && (
                  <span className="flex items-center gap-1 text-sm">
                    <MapPin size={14} />
                    {buyer.country}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm">
                  <ListMusic size={14} />
                  {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Calendar size={14} />
                  Member since 2023
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <Button 
                  onClick={() => navigate("/settings")} 
                  size="sm" 
                  variant="default" 
                  className="gap-1.5 bg-purple-600 hover:bg-purple-700"
                >
                  <Settings size={14} />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="default" className="gap-1.5 bg-purple-600 hover:bg-purple-700">
                    <UserPlus size={14} />
                    Follow
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={handleShareProfile}>
                    <Share2 size={14} />
                    Share
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <MessageSquare size={14} />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {buyer.bio ? (
            <p className="text-sm md:text-base mb-4 max-w-3xl">{buyer.bio}</p>
          ) : (
            <p className="text-muted-foreground italic mb-4 text-sm md:text-base">
              {isOwnProfile ? "You haven't added a bio yet. Add one in your profile settings." : "This user hasn't added a bio yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
