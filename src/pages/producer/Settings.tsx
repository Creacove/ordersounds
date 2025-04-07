
import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, isProducerInactive } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "Producer Settings | OrderSOUNDS";
    
    // Redirect to login if not authenticated 
    if (!user) {
      navigate('/login', { state: { from: '/producer/settings' } });
      return;
    } 
    // Redirect to home if not a producer
    if (user.role !== 'producer') {
      navigate('/');
      return;
    }
    // Redirect inactive producers to activation page
    if (isProducerInactive) {
      navigate('/producer-activation');
      return;
    }
  }, [user, navigate, isProducerInactive]);

  // If not logged in or not a producer or inactive producer, show loading while redirect happens
  if (!user || user.role !== 'producer' || isProducerInactive) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Producer Settings</h1>
        
        {/* Settings content will go here */}
        <div className="bg-card border rounded-lg p-6">
          <p>Producer settings content will be implemented here.</p>
        </div>
      </div>
    </MainLayout>
  );
}
