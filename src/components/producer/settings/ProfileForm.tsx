import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ProfileFormProps {
  initialProducerName: string;
  initialBio: string;
  initialLocation: string;
}

export function ProfileForm({ initialProducerName, initialBio, initialLocation }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [producerName, setProducerName] = useState(initialProducerName);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const { user, updateProfile, forceUserDataRefresh } = useAuth();
  const { toast } = useToast();

  const handleSaveProfile = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use AuthContext updateProfile instead of direct Supabase calls
      await updateProfile({
        ...user,
        producer_name: producerName,
        bio: bio,
        country: location
      });
      
      // Force refresh user data to update topbar display
      await forceUserDataRefresh();
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setSaveSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="stageName" size="lg">Stage Name</Label>
        <Input 
          id="stageName" 
          placeholder="Your stage name" 
          value={producerName}
          onChange={(e) => setProducerName(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio" size="lg">Bio</Label>
        <textarea 
          id="bio" 
          className="w-full min-h-32 p-2 rounded-md border border-input bg-background"
          placeholder="Tell buyers about yourself"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location" size="lg">Location</Label>
        <Input 
          id="location" 
          placeholder="Your location" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          className="w-full md:w-auto"
          onClick={handleSaveProfile}
          disabled={isLoading}
          variant={saveSuccess ? "outline" : "default"}
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
