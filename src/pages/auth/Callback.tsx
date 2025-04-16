
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoleSelectionDialog } from '@/components/auth/RoleSelectionDialog';
import { Button } from '@/components/ui/button';
import { uniqueToast } from '@/lib/toast';
import { logCallbackEvent, initiateRecoveryFlow } from '@/lib/authLogger';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, updateUserInfo, refreshSession, recoverSession } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showRecoveryOption, setShowRecoveryOption] = useState(false);
  const [isUserProfileLoading, setIsUserProfileLoading] = useState(false);
  const [maxRetryReached, setMaxRetryReached] = useState(false);

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
          
          // Store email for potential recovery
          setUserEmail(data.session.user.email);
          
          // If we already have basic user info but need additional profile data
          if (user && user.id === data.session.user.id) {
            console.log("User already in context, fetching additional profile data");
            setIsUserProfileLoading(true);
            
            try {
              // Direct database fetch as a fallback when context loading fails
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role, status, full_name')
                .eq('id', user.id)
                .maybeSingle();
              
              if (userError) {
                console.error("Direct user fetch error:", userError);
                throw userError;
              }
              
              if (userData) {
                console.log("Successfully fetched user data directly:", userData);
                
                // Update user context with the fetched data
                updateUserInfo({
                  ...user,
                  role: userData.role as 'buyer' | 'producer' | 'admin',
                  status: userData.status as 'active' | 'inactive',
                  name: userData.full_name || user.name
                });
                
                // Redirect based on role
                if (userData.role === 'producer') {
                  if (userData.status === 'inactive') {
                    navigate('/producer-activation');
                  } else {
                    navigate('/producer/dashboard');
                  }
                } else {
                  navigate('/');
                }
                return;
              } else {
                throw new Error("No user data found in database");
              }
            } catch (profileError: any) {
              console.error("Profile recovery failed:", profileError);
              setError(`Failed to load complete user profile: ${profileError.message}`);
              setShowRecoveryOption(true);
            } finally {
              setIsUserProfileLoading(false);
            }
          } else {
            // Proceed with normal user data fetching flow
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
                  
                  // After max retries, show recovery option
                  setMaxRetryReached(true);
                  setShowRecoveryOption(true);
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
                
                // Show recovery options when processing fails
                setShowRecoveryOption(true);
                setIsLoading(false);
              }
            }, wasOAuthFlow ? 1500 : 500);
          }
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
        
        // Show recovery option on critical errors
        setShowRecoveryOption(true);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    handleAuthCallback();
  }, [navigate, updateUserInfo, user, retryCount, refreshSession]);

  const handleRecovery = () => {
    recoverSession(userEmail || undefined);
  };

  const handleForceUserDataRefresh = async () => {
    if (!user) {
      toast.error("No user session available");
      return;
    }
    
    setIsUserProfileLoading(true);
    setError(null);
    
    try {
      // Direct force update of user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      
      if (userData) {
        // Update user in context with all available data
        updateUserInfo({
          ...user,
          role: userData.role as 'buyer' | 'producer' | 'admin',
          status: userData.status as 'active' | 'inactive',
          name: userData.full_name || user.name,
          bio: userData.bio || user.bio || '',
          country: userData.country || user.country || '',
          avatar_url: userData.profile_picture || user.avatar_url || '',
          producer_name: userData.stage_name || user.producer_name || ''
        });
        
        toast.success("User data refreshed successfully");
        
        // Redirect based on role
        if (userData.role === 'producer') {
          if (userData.status === 'inactive') {
            navigate('/producer-activation');
          } else {
            navigate('/producer/dashboard');
          }
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      console.error("Failed to refresh user data:", error);
      setError(`Failed to refresh user data: ${error.message}`);
      toast.error("Could not refresh user data. Please try logging in again.");
    } finally {
      setIsUserProfileLoading(false);
    }
  };

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
        
        {isUserProfileLoading && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <h2 className="mt-4 text-xl">Refreshing user data...</h2>
          </>
        )}
        
        {error && !isLoading && !isUserProfileLoading && (
          <>
            <div className="text-destructive mb-4">
              <p className="text-xl font-semibold">Authentication Error</p>
              <p className="text-sm">{error}</p>
            </div>
            {showRecoveryOption ? (
              <div className="flex flex-col gap-2 items-center">
                {user && (
                  <>
                    <div className="flex flex-col items-center p-4 border border-amber-200 bg-amber-50 rounded-lg mb-4">
                      <p className="font-medium text-amber-800">
                        You appear to be signed in as {user.name || user.email}, but we're having trouble loading your complete profile data.
                      </p>
                      <Button 
                        onClick={handleForceUserDataRefresh}
                        className="mt-4 bg-amber-600 hover:bg-amber-700"
                        disabled={isUserProfileLoading}
                      >
                        {isUserProfileLoading ? "Refreshing..." : "Refresh User Data"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      If refreshing doesn't work, you can try to restart your session:
                    </p>
                  </>
                )}
                
                <Button 
                  onClick={handleRecovery}
                  className={user ? "bg-gray-600 hover:bg-gray-700" : "mt-4 bg-amber-600 hover:bg-amber-700"}
                >
                  {maxRetryReached ? "Reset Authentication Session" : "Restart Authentication Process"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This will sign you out and redirect you to login
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/login')}
                  className="mt-2"
                >
                  Return to Login
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => navigate('/login')}
                className="mt-4"
              >
                Return to Login
              </Button>
            )}
          </>
        )}
        {!isLoading && !showRoleSelection && !error && !isUserProfileLoading && (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        )}
      </div>
    </MainLayout>
  );
}
