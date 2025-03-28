
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { FcGoogle } from 'react-icons/fc';

interface GoogleAuthButtonProps {
  mode: 'login' | 'signup';
}

export function GoogleAuthButton({ mode }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrency } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        toast.error(error.message || "Failed to sign in with Google");
        console.error('Google auth error:', error);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('An error occurred during Google authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="w-full flex items-center justify-center gap-2"
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full" />
      ) : (
        <FcGoogle className="h-5 w-5" />
      )}
      {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
    </Button>
  );
}
