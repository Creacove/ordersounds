import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getInitials } from "@/utils/formatters";
import { uploadFile } from "@/lib/storage";

interface ProfileFormProps {
  initialProducerName: string;
  initialBio: string;
  initialLocation: string;
  avatarUrl: string | null;
  displayName: string;
  isBuyer?: boolean;
  initialFullName?: string;
  initialMusicInterests?: string[];
}

export function ProfileForm({ 
  initialProducerName, 
  initialBio, 
  initialLocation, 
  avatarUrl, 
  displayName,
  isBuyer = false,
  initialFullName = '',
  initialMusicInterests = []
}: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [producerName, setProducerName] = useState(initialProducerName);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const [fullName, setFullName] = useState(initialFullName);
  const [musicInterests, setMusicInterests] = useState<string[]>(initialMusicInterests);
  const [newInterest, setNewInterest] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, updateProfile } = useAuth();

  const handleChooseFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const imageUrl = await uploadFile(file, 'avatars', 'profiles');
      setPreviewUrl(imageUrl);

      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { error } = await supabase
        .from('users')
        .update({ profile_picture: imageUrl })
        .eq('id', user.id);
          
      if (error) throw error;
      
      if (updateProfile) {
        await updateProfile({
          ...user,
          avatar_url: imageUrl
        });
      }
      
      toast.success("Profile picture updated successfully");
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error handling avatar change:', error);
      toast.error("Failed to process the image");
    } finally {
      setIsLoading(false);
    }
  };

  const addMusicInterest = () => {
    if (newInterest.trim() !== '' && !musicInterests.includes(newInterest.trim())) {
      setMusicInterests([...musicInterests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeMusicInterest = (interest: string) => {
    setMusicInterests(musicInterests.filter(item => item !== interest));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const updateData = isBuyer 
        ? {
            full_name: fullName,
            bio: bio,  // Allow bio for buyers
            country: location,
            music_interests: musicInterests
          }
        : {
            stage_name: producerName,
            bio: bio,
            country: location,
            music_interests: musicInterests
          };
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      if (updateProfile) {
        const profileData = isBuyer 
          ? {
              ...user,
              name: fullName,
              bio: bio,  // Update bio in user state
              country: location,
              music_interests: musicInterests
            }
          : {
              ...user,
              producer_name: producerName,
              bio: bio,
              country: location,
              music_interests: musicInterests
            };
            
        await updateProfile(profileData);
      }
      
      toast.success("Profile updated successfully");
      setSaveSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={previewUrl || undefined} alt={displayName} />
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="icon" 
                variant="outline" 
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Profile Picture</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Select an image to use as your profile picture. Files should be JPG, PNG or GIF and less than 2MB.
                </p>
                <div className="flex flex-col items-center justify-center gap-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={previewUrl || undefined} alt={displayName} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  
                  <input 
                    ref={fileInputRef}
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                    disabled={isLoading}
                  />
                  
                  <Button 
                    variant="outline" 
                    className="cursor-pointer"
                    disabled={isLoading}
                    onClick={handleChooseFileClick}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center w-full">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        <span>Choose File</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Click the camera icon to update your profile picture
        </p>
      </div>

      <div className="space-y-4">
        {isBuyer ? (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              placeholder="Your full name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="stageName">Stage Name</Label>
            <Input 
              id="stageName" 
              placeholder="Your stage name" 
              value={producerName}
              onChange={(e) => setProducerName(e.target.value)}
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            className="min-h-[120px]"
            placeholder={isBuyer ? "Tell us about yourself" : "Tell buyers about yourself"}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location" 
            placeholder="Your location" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="musicInterests">Music Interests</Label>
          <div className="flex gap-2">
            <Input 
              id="musicInterests" 
              placeholder="Add music interests" 
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMusicInterest())}
            />
            <Button 
              type="button" 
              variant="secondary"
              onClick={addMusicInterest}
            >
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {musicInterests.map((interest, index) => (
              <div 
                key={index} 
                className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                <span>{interest}</span>
                <button 
                  type="button" 
                  className="text-purple-800 hover:text-purple-900"
                  onClick={() => removeMusicInterest(interest)}
                >
                  ×
                </button>
              </div>
            ))}
            {musicInterests.length === 0 && (
              <p className="text-sm text-muted-foreground">No music interests added yet</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleSaveProfile}
          disabled={isLoading}
          variant={saveSuccess ? "outline" : "default"}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : saveSuccess ? (
            <div className="flex items-center justify-center w-full">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Saved</span>
            </div>
          ) : (
            <span>Save Changes</span>
          )}
        </Button>
        
        {saveSuccess && (
          <span className="text-sm text-muted-foreground">Changes saved successfully</span>
        )}
      </div>
    </div>
  );
}
