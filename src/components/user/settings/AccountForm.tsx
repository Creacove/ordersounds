
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, EyeIcon, EyeOffIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface AccountFormProps {
  userEmail: string;
}

export function AccountForm({ userEmail }: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user } = useAuth();

  const handleUpdatePassword = async () => {
    if (!user) return;
    
    try {
      // Validation
      if (!currentPassword) {
        toast.error("Please enter your current password");
        return;
      }
      
      if (!newPassword) {
        toast.error("Please enter a new password");
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast.error("New password and confirmation do not match");
        return;
      }
      
      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }
      
      setIsLoading(true);
      
      // First verify the current password is correct by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      
      if (signInError) {
        toast.error("Current password is incorrect");
        setIsLoading(false);
        return;
      }
      
      // Then update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Password updated successfully");
      setSaveSuccess(true);
      
      // Clear fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="email">Email Address</Label>
        </div>
        <Input 
          id="email" 
          type="email"
          value={userEmail}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input 
            id="currentPassword" 
            type={showCurrentPassword ? "text" : "password"}
            placeholder="Enter current password" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showCurrentPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input 
            id="newPassword" 
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter new password" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showNewPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input 
            id="confirmPassword" 
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            <span className="sr-only">
              {showConfirmPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleUpdatePassword}
          disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
          variant={saveSuccess ? "outline" : "default"}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Updating...</span>
            </div>
          ) : saveSuccess ? (
            <div className="flex items-center justify-center w-full">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Updated</span>
            </div>
          ) : (
            <span>Update Password</span>
          )}
        </Button>
        
        {saveSuccess && (
          <span className="text-sm text-muted-foreground">Password updated successfully</span>
        )}
      </div>
    </div>
  );
}
