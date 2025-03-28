import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { RoleSelectionDialog } from '@/components/auth/RoleSelectionDialog';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
          
          // Check if user exists and has a role
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.session.user.id)
            .single();
            
          if (userError && userError.code !== 'PGRST116') {
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
          
          console.log("User has role:", userData.role);
          
          // Otherwise, redirect based on role
          if (userData.role === 'producer') {
            navigate('/producer/dashboard');
          } else {
            navigate('/');
          }
          
          toast.success('Successfully signed in!');
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
  }, [navigate]);

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
