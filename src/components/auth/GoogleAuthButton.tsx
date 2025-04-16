
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

  // Log Google auth events
  const logGoogleAuthEvent = async (event: string, details: any = {}) => {
    try {
      const eventData = {
        event_type: `google_${event}`,
        user_id: details.user_id || 'anonymous',
        details: JSON.stringify({
          ...details,
          timestamp: new Date().toISOString(),
        }),
        created_at: new Date().toISOString()
      };

      // Store in Supabase (assuming an auth_logs table exists)
      await supabase.from('auth_logs').insert([eventData]);
    } catch (error) {
      // Silent error - don't break the app if logging fails
      console.error('Failed to log Google auth event:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      console.log("Starting Google authentication flow...");
      
      // Get the current URL without any query parameters or hash
      const origin = typeof window !== 'undefined' ? 
        window.location.origin : 
        'https://app.ordersounds.com';
        
      // Set redirect URL with absolute path to callback handler
      const redirectUrl = `${origin}/auth/callback`;
      
      console.log(`Setting redirect URL to: ${redirectUrl}`);
      
      // Clear any previous OAuth errors from storage
      localStorage.removeItem('supabase.auth.error');
      sessionStorage.removeItem('supabase.auth.error');
      
      // Use a more robust OAuth flow with explicit parameters
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            // Request offline access for refresh tokens
            access_type: 'offline',
            // Always prompt for consent to ensure refresh token
            prompt: 'consent',
            // Request scopes needed for user data
            scope: 'email profile',
          }
        },
      });

      if (error) {
        uniqueToast.error(error.message || "Failed to sign in with Google");
        console.error('Google auth error:', error);
        logGoogleAuthEvent('auth_error', { error: error.message });
      } else if (data?.url) {
        console.log("OAuth auth initiated successfully, redirecting to:", data.url);
        logGoogleAuthEvent('auth_initiated', {});
        
        // Store additional data about this OAuth attempt
        try {
          localStorage.setItem('oauth_initiated', new Date().toISOString());
          localStorage.setItem('oauth_provider', 'google');
          localStorage.setItem('oauth_mode', mode);
        } catch (err) {
          console.warn('Could not store OAuth data in localStorage', err);
        }
        
        // The redirect will happen automatically via Supabase
        window.location.href = data.url;
      } else {
        uniqueToast.error('Failed to initialize Google sign in');
        logGoogleAuthEvent('auth_no_url', {});
      }
    } catch (error: any) {
      console.error('Google auth error:', error);
      uniqueToast.error('An error occurred during Google authentication');
      logGoogleAuthEvent('auth_exception', { error: error.message });
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
