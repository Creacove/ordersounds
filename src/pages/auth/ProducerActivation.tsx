
import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProducerActivation() {
  const { user } = useAuth();
  
  return (
    <MainLayout hideSidebar>
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-6">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-border">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Account Activation Required</h1>
          
          <p className="text-muted-foreground mb-6">
            Your producer account is currently inactive. Please contact the admin to activate your account and gain full access to the platform.
          </p>
          
          {user && (
            <p className="text-sm text-muted-foreground mb-8">
              Email: <span className="font-medium text-foreground">{user.email}</span>
            </p>
          )}
          
          <Button 
            className="min-w-[200px]"
            size="lg"
            asChild
          >
            <a href="mailto:admin@ordersounds.com?subject=Producer%20Account%20Activation&body=Hello%2C%0A%0APlease%20activate%20my%20producer%20account.%0A%0ARegards%2C%0A">
              Contact Admin
            </a>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
