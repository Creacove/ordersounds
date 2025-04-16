
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoleSelectionDialog } from '@/components/auth/RoleSelectionDialog';
import { Button } from '@/components/ui/button';
import { uniqueToast } from '@/lib/toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, updateUserInfo, refreshSession } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  // Function to log auth callback events
  const logCallbackEvent = async (event: string, details: any = {}) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      // Log to console for now until types are updated
      console.log('Auth callback event:', {
        event_type: `callback_${event}`,
        user_id: userId || details.user_id || 'anonymous',
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString()
      });
      
      // Once types are updated, we can use this:
      // await supabase.from('auth_logs').insert([{
      //   event_type: `callback_${event}`,
      //   user_id: userId || details.user_id || 'anonymous',
      //   details: JSON.stringify({
      //     ...details,
      //     timestamp: new Date().toISOString(),
      //   }),
      //   created_at: new Date().toISOString()
      // }]);
    } catch (error) {
      // Silent error - don't break the app if logging fails
      console.error('Failed to log auth callback event:', error);
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Auth callback: Processing authentication response");
        
        // Check if this was a Google OAuth flow
        const wasOAuthFlow = localStorage.getItem('oauth_initiated');
        const oauthProvider = localStorage.getItem('oauth_provider');
        setIsGoogleAuth(oauthProvider === 'google');
        
        if (wasOAuthFlow && oauthProvider === 'google') {
          console.log("This appears to be a Google OAuth flow");
          logCallbackEvent('google_detected', { oauth_initiated: wasOAuthFlow });
        }
        
        // Get the session to see if we're authenticated
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setError(`Session error: ${error.message}`);
          logCallbackEvent('session_error', { error: error.message });
          
          // Try to recover using session refresh
          const refreshed = await refreshSession();
          if (!refreshed) {
            throw error;
          } else {
            console.log("Auth callback: Session refreshed successfully");
            logCallbackEvent('session_refreshed');
          }
        }
        
        if (data?.session) {
          console.log("Auth callback: Session found", data.session.user.id);
          logCallbackEvent('session_found', { user_id: data.session.user.id });
          
          // Check if user exists and has a role with additional timeout for Google auth
          setTimeout(async () => {
            try {
              // Check if user exists and has a role
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role, status')
                .eq('id', data.session.user.id)
                .maybeSingle();
              
              // Handle database connection errors with retries
              if (userError) {
                console.error("User data fetch error:", userError);
                setError(`User data error: ${userError.message}`);
                logCallbackEvent('user_data_error', { 
                  error: userError.message,
                  user_id: data.session.user.id
                });
                
                // Retry logic for temporary connection issues
                if (retryCount < 3) {
                  setRetryCount(prev => prev + 1);
                  console.log(`Retrying user data fetch (${retryCount + 1}/3)...`);
                  setTimeout(() => handleAuthCallback(), 1500);
                  return;
                }
                
                throw userError;
              }
              
              // If the user doesn't have a role yet, show the role selection dialog
              if (!userData?.role) {
                console.log("No role found, showing role selection");
                logCallbackEvent('no_role_found', { user_id: data.session.user.id });
                setShowRoleSelection(true);
                setIsLoading(false);
                return;
              }
              
              console.log("User has role:", userData.role, "Status:", userData.status);
              logCallbackEvent('role_found', { 
                role: userData.role,
                status: userData.status,
                user_id: data.session.user.id
              });
              
              // Ensure role is a valid type
              const validRole: 'buyer' | 'producer' | 'admin' = 
                (userData.role === 'buyer' || userData.role === 'producer' || userData.role === 'admin') 
                  ? userData.role 
                  : 'buyer';
              
              // Ensure status is a valid type
              const validStatus: 'active' | 'inactive' =
                userData.status === 'active' || userData.status === 'inactive'
                  ? userData.status
                  : 'inactive';
              
              // Update user info with status
              if (userData && user) {
                updateUserInfo({
                  ...user,
                  role: validRole,
                  status: validStatus
                });
              }
              
              // Handle inactive producer - ALWAYS redirect to activation page
              if (validRole === 'producer' && validStatus === 'inactive') {
                console.log("Inactive producer, redirecting to activation page");
                logCallbackEvent('producer_inactive_redirect', { user_id: data.session.user.id });
                navigate('/producer-activation');
                return;
              }
              
              // Otherwise, redirect based on role without notification
              if (validRole === 'producer') {
                navigate('/producer/dashboard');
              } else {
                navigate('/');
              }
              
              // Clean up OAuth data
              localStorage.removeItem('oauth_initiated');
              localStorage.removeItem('oauth_provider');
              localStorage.removeItem('oauth_mode');
              
            } catch (error: any) {
              console.error('Error processing user data:', error);
              setError(`User processing error: ${error.message}`);
              logCallbackEvent('user_processing_error', { error: error.message });
              
              // On error, redirect to home page with a notification
              navigate('/');
              uniqueToast.error('Error processing account data');
            } finally {
              setIsLoading(false);
            }
          }, wasOAuthFlow ? 1500 : 500); // Increased delay for Google auth to ensure everything is synced
          
        } else {
          console.log("No session found, redirecting to login");
          setError("No session found in response");
          logCallbackEvent('no_session');
          
          // No session found, redirect to login
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Error handling auth callback:', error);
        setError(`Auth callback error: ${error.message}`);
        logCallbackEvent('callback_exception', { error: error.message });
        uniqueToast.error('Authentication failed');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    handleAuthCallback();
  }, [navigate, updateUserInfo, user, retryCount, refreshSession]);

  return (
    <MainLayout hideSidebar>
      <RoleSelectionDialog 
        open={showRoleSelection} 
        onOpenChange={setShowRoleSelection} 
      />
      <div className="flex flex-col items-center justify-center min-h-screen">
        {isLoading && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <h2 className="mt-4 text-xl">
              {isGoogleAuth ? "Completing Google sign-in..." : "Signing you in..."}
            </h2>
            {retryCount > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Connecting to server... (Attempt {retryCount + 1}/4)
              </p>
            )}
          </>
        )}
        {error && !isLoading && (
          <>
            <div className="text-destructive mb-4">
              <p className="text-xl font-semibold">Authentication Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button 
              onClick={() => navigate('/login')}
              className="mt-4"
            >
              Return to Login
            </Button>
          </>
        )}
        {!isLoading && !showRoleSelection && !error && (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        )}
      </div>
    </MainLayout>
  );
}
