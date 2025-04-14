
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getInitials } from "@/utils/formatters";
import { uploadImage } from "@/lib/imageStorage";

interface ProfilePictureUploaderProps {
  avatarUrl: string | null;
  displayName: string;
}

export function ProfilePictureUploader({ avatarUrl, displayName }: ProfilePictureUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const handleChooseFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 2MB",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a local preview immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewUrl(event.target.result.toString());
        }
      };
      reader.readAsDataURL(file);
      
      // Upload to storage using our uploadImage helper
      const imageUrl = await uploadImage(file, 'avatars', user.id);
      
      // Update the user profile with the new avatar URL
      if (imageUrl) {
        const { error } = await supabase
          .from('users')
          .update({ avatar_url: imageUrl })
          .eq('id', user.id);
          
        if (error) throw error;
        
        if (updateProfile) {
          await updateProfile({
            ...user,
            avatar_url: imageUrl
          });
        }
        
        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        });
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
                
                {/* Hidden file input */}
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
                      <Upload className="h-4 w-4 mr-2" />
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
  );
}
