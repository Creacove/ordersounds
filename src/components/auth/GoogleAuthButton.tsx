
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { uniqueToast } from '@/lib/toast';
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
      
      // Get the current origin with fallbacks for different environments
      const origin = typeof window !== 'undefined' ? 
        window.location.origin : 
        'https://ordersounds.com';
        
      const redirectUrl = `${origin}/auth/callback`;
      
      console.log(`Setting redirect URL to: ${redirectUrl}`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        uniqueToast.error(error.message || "Failed to sign in with Google");
        console.error('Google auth error:', error);
      } else {
        console.log("OAuth auth initiated successfully, redirecting...");
        // No need to do anything else, the redirect will happen automatically
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      uniqueToast.error('An error occurred during Google authentication');
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
