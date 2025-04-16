import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoleSelectionDialog } from '@/components/auth/RoleSelectionDialog';
import { Button } from '@/components/ui/button';
import { uniqueToast } from '@/lib/toast';
import { logCallbackEvent } from '@/lib/authLogger';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, updateUserInfo, refreshSession } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Auth callback: Processing authentication response");
        
        const wasOAuthFlow = localStorage.getItem('oauth_initiated');
        const oauthProvider = localStorage.getItem('oauth_provider');
        setIsGoogleAuth(oauthProvider === 'google');
        
        if (wasOAuthFlow && oauthProvider === 'google') {
          console.log("This appears to be a Google OAuth flow");
          await logCallbackEvent('google_detected', { oauth_initiated: wasOAuthFlow });
        }
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setError(`Session error: ${error.message}`);
          await logCallbackEvent('session_error', { error: error.message });
          
          const refreshed = await refreshSession();
          if (!refreshed) {
            throw error;
          } else {
            console.log("Auth callback: Session refreshed successfully");
            await logCallbackEvent('session_refreshed');
          }
        }
        
        if (data?.session) {
          console.log("Auth callback: Session found", data.session.user.id);
          await logCallbackEvent('session_found', { user_id: data.session.user.id });
          
          setTimeout(async () => {
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role, status')
                .eq('id', data.session.user.id)
                .maybeSingle();
              
              if (userError) {
                console.error("User data fetch error:", userError);
                setError(`User data error: ${userError.message}`);
                await logCallbackEvent('user_data_error', { 
                  error: userError.message,
                  user_id: data.session.user.id
                });
                
                if (retryCount < 3) {
                  setRetryCount(prev => prev + 1);
                  console.log(`Retrying user data fetch (${retryCount + 1}/3)...`);
                  setTimeout(() => handleAuthCallback(), 1500);
                  return;
                }
                
                throw userError;
              }
              
              if (!userData?.role) {
                console.log("No role found, showing role selection");
                await logCallbackEvent('no_role_found', { user_id: data.session.user.id });
                setShowRoleSelection(true);
                setIsLoading(false);
                return;
              }
              
              console.log("User has role:", userData.role, "Status:", userData.status);
              await logCallbackEvent('role_found', { 
                role: userData.role,
                status: userData.status,
                user_id: data.session.user.id
              });
              
              const validRole: 'buyer' | 'producer' | 'admin' = 
                (userData.role === 'buyer' || userData.role === 'producer' || userData.role === 'admin') 
                  ? userData.role 
                  : 'buyer';
              
              const validStatus: 'active' | 'inactive' =
                userData.status === 'active' || userData.status === 'inactive'
                  ? userData.status
                  : 'inactive';
              
              if (userData && user) {
                updateUserInfo({
                  ...user,
                  role: validRole,
                  status: validStatus
                });
              }
              
              if (validRole === 'producer' && validStatus === 'inactive') {
                console.log("Inactive producer, redirecting to activation page");
                await logCallbackEvent('producer_inactive_redirect', { user_id: data.session.user.id });
                navigate('/producer-activation');
                return;
              }
              
              if (validRole === 'producer') {
                navigate('/producer/dashboard');
              } else {
                navigate('/');
              }
              
              localStorage.removeItem('oauth_initiated');
              localStorage.removeItem('oauth_provider');
              localStorage.removeItem('oauth_mode');
              
            } catch (error: any) {
              console.error('Error processing user data:', error);
              setError(`User processing error: ${error.message}`);
              await logCallbackEvent('user_processing_error', { error: error.message });
              
              navigate('/');
              uniqueToast.error('Error processing account data');
            } finally {
              setIsLoading(false);
            }
          }, wasOAuthFlow ? 1500 : 500);
        } else {
          console.log("No session found, redirecting to login");
          setError("No session found in response");
          await logCallbackEvent('no_session');
          
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Error handling auth callback:', error);
        setError(`Auth callback error: ${error.message}`);
        await logCallbackEvent('callback_exception', { error: error.message });
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
