import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoleSelectionDialog } from '@/components/auth/RoleSelectionDialog';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, updateUserInfo } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsLoading(true);
        console.log("Auth callback: Processing authentication response");
        
        // Get the session from the URL (Supabase handles this)
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          throw error;
        }
        
        if (data?.session) {
          console.log("Auth callback: Session found", data.session.user.id);
          
          // Add a delay before fetching user data to ensure the session is properly registered
          setTimeout(async () => {
            try {
              // Check if user exists and has a role
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role, status')
                .eq('id', data.session.user.id)
                .maybeSingle();
                
              if (userError) {
                console.error("User data fetch error:", userError);
                throw userError;
              }
              
              // If the user doesn't have a role yet, show the role selection dialog
              if (!userData?.role) {
                console.log("No role found, showing role selection");
                setShowRoleSelection(true);
                setIsLoading(false);
                return;
              }
              
              console.log("User has role:", userData.role, "Status:", userData.status);
              
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
                navigate('/producer-activation');
                toast.info('Please complete your activation to access the producer features');
                return;
              }
              
              // Otherwise, redirect based on role
              if (validRole === 'producer') {
                navigate('/producer/dashboard');
              } else {
                navigate('/');
              }
              
              toast.success('Successfully signed in!');
            } catch (error) {
              console.error('Error processing user data:', error);
              // On error, redirect to home page with a notification
              navigate('/');
              toast.error('Error processing account data. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }, 500); // Add small delay to avoid race conditions
        } else {
          console.log("No session found, redirecting to login");
          // No session found, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    handleAuthCallback();
  }, [navigate, updateUserInfo, user]);

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
            <h2 className="mt-4 text-xl">Completing authentication...</h2>
          </>
        )}
        {!isLoading && !showRoleSelection && (
          <>
            <h2 className="text-2xl">Authentication completed</h2>
            <p className="mt-2">You will be redirected shortly...</p>
          </>
        )}
      </div>
    </MainLayout>
  );
}
