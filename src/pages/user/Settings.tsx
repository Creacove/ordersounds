
import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProducerTabs } from "@/components/user/settings/ProducerTabs";
import { BuyerTabs } from "@/components/user/settings/BuyerTabs";
import { LoginPrompt } from "@/components/user/settings/LoginPrompt";

export default function UserSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "Settings | OrderSOUNDS";
    
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login', { state: { from: '/settings' } });
    }
  }, [user, navigate]);

  // If not logged in, show login prompt
  if (!user) {
    return (
      <MainLayout>
        <LoginPrompt />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={cn(
        "container py-6 md:py-8",
        isMobile ? "mobile-content-padding" : ""
      )}>
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
          {user.role === "producer" ? "Producer Settings" : "Account Settings"}
        </h1>
        
        <Tabs defaultValue="profile" className="w-full">
          {user.role === "producer" ? <ProducerTabs user={user} /> : <BuyerTabs user={user} />}
        </Tabs>
      </div>
    </MainLayout>
  );
}
