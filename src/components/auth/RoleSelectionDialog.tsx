
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSelectionDialog({ open, onOpenChange }: RoleSelectionDialogProps) {
  const [role, setRole] = useState<'buyer' | 'producer'>('buyer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { updateProfile } = useAuth();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Update the user's metadata with the selected role
      const userData = {
        id: user.id,
        role: role,
        name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      };
      
      // Update the user profile
      await updateProfile(userData);
      
      toast.success(`Account set up successfully as a ${role}!`);
      onOpenChange(false);
      
      // Redirect based on role
      if (role === 'producer') {
        navigate('/producer/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error setting user role:', error);
      toast.error('Failed to set up your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to OrderSOUNDS!</DialogTitle>
          <DialogDescription>
            Please select your role to complete your account setup.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <RadioGroup 
            value={role} 
            onValueChange={(value) => setRole(value as 'buyer' | 'producer')}
            className="flex flex-col gap-4"
          >
            <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-accent cursor-pointer">
              <RadioGroupItem value="buyer" id="buyer" />
              <div className="flex-1">
                <Label htmlFor="buyer" className="text-base font-medium cursor-pointer">Buyer</Label>
                <p className="text-sm text-muted-foreground">
                  I want to discover and buy beats from talented producers.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 border rounded-md hover:bg-accent cursor-pointer">
              <RadioGroupItem value="producer" id="producer" />
              <div className="flex-1">
                <Label htmlFor="producer" className="text-base font-medium cursor-pointer">Producer</Label>
                <p className="text-sm text-muted-foreground">
                  I want to create and sell my beats on the platform.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting} 
          className="w-full"
        >
          {isSubmitting ? 'Setting up your account...' : 'Continue'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
