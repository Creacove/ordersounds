
import { useState } from 'react';
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
      console.log("Starting Google authentication flow...");
      
      // The redirectTo URL must match EXACTLY what's configured in Google Cloud Console
      // AND in the Supabase Auth settings as an authorized redirect URL
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://app.ordersounds.com/auth/callback',
          queryParams: {
            // Force account selection to prevent issues with Google Suite accounts
            // Include access_type offline to get refresh token
            // Explicitly request consent to ensure refresh token is provided
            prompt: 'consent',
            access_type: 'offline',
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
      className="w-full flex items-center justify-center gap-2 border-white/10 hover:bg-white/5 transition-all"
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
