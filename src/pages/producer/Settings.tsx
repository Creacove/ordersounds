import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProducerBankDetailsForm } from "@/components/payment/ProducerBankDetailsForm";
import { ProducerWalletDetailsForm } from "@/components/payment/ProducerWalletDetailsForm";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  Settings as SettingsIcon,
  DollarSign,
  User,
  KeyRound,
  Wallet,
} from "lucide-react";
import { ProfileForm } from "@/components/producer/settings/ProfileForm";
import { ProfilePictureUploader } from "@/components/producer/settings/ProfilePictureUploader";
import { PaymentStatsSection } from "@/components/producer/settings/PaymentStatsSection";
import { PreferencesForm } from "@/components/producer/settings/PreferencesForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ProducerSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [producerSettings, setProducerSettings] = useState<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    autoPlayPreviews: boolean;
  }>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    autoPlayPreviews: true,
  });
  const [producerData, setProducerData] = useState<any>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    document.title = "Producer Settings | OrderSOUNDS";

    if (!user) {
      navigate("/login", { state: { from: "/producer/settings" } });
    } else if (user.role !== "producer") {
      navigate("/");
    }

    if (user?.settings) {
      try {
        const settings =
          typeof user.settings === "string"
            ? JSON.parse(user.settings)
            : user.settings;

        setProducerSettings({
          emailNotifications: settings.emailNotifications !== false,
          pushNotifications: settings.pushNotifications !== false,
          smsNotifications: settings.smsNotifications === true,
          autoPlayPreviews: settings.autoPlayPreviews !== false,
        });
      } catch (e) {
        console.error("Error parsing user settings:", e);
      }
    }
  }, [user, navigate]);

  // Fetch producer data including bank details and subaccount info
  useEffect(() => {
    const fetchProducerData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            "bank_code, account_number, verified_account_name, paystack_subaccount_code, paystack_split_code, wallet_address"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching producer data:", error);
          return;
        }

        setProducerData(data);
      } catch (error) {
        console.error("Error fetching producer data:", error);
      }
    };

    fetchProducerData();
  }, [user]);

  const handleBankDetailsSuccess = () => {
    // No need to reload the page
    if (user) {
      // Refresh the bank details data
      supabase
        .from("users")
        .select("bank_code, account_number, verified_account_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            console.log("Updated bank details:", data);
          }
        });
    }
  };

  const handleWalletUpdateSuccess = () => {
    // Refresh producer data after wallet update
    if (user) {
      supabase
        .from("users")
        .select("wallet_address")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error refreshing wallet data:", error);
            return;
          }
          if (data) {
            setProducerData(prev => ({...prev, wallet_address: data.wallet_address}));
            toast.success("Wallet address updated successfully");
          }
        });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error("New password must include at least one uppercase letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error("New password must include at least one number");
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      toast.error("New password must include at least one special character");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    try {
      setIsChangingPassword(true);

      // Verify current password by attempting to sign in
      if (!user?.email) {
        toast.error(
          "Unable to verify your current session, please log in again"
        );
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setIsChangingPassword(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error(`Password update failed: ${updateError.message}`);
        setIsChangingPassword(false);
        return;
      }

      // Success
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("An error occurred while changing your password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user || user.role !== "producer") {
    return (
      <MainLayout>
        <div className="container py-16 pb-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Producer Access Required
            </h1>
            <p className="text-base mb-4">
              You need to be logged in as a producer to access this page.
            </p>
            <Button onClick={() => navigate("/login")}>Login</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div
        className={cn(
          "container py-6 md:py-8 pb-32",
          isMobile ? "mobile-content-padding" : ""
        )}
      >
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
          Producer Settings
        </h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4 mb-6 md:mb-8 overflow-hidden">
            <TabsTrigger value="profile" className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>Payment</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center gap-1"
            >
              <Bell className="w-4 h-4" />
              <span>Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-1">
              <KeyRound className="w-4 h-4" />
              <span>Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">
                  Profile Information
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Update your producer profile information that will be visible
                  to buyers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProfilePictureUploader />

                <ProfileForm
                  initialProducerName={user.producer_name || user.name || ""}
                  initialBio={user.bio || ""}
                  initialLocation={user.country || ""}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Solana Wallet
                    </div>
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Set up your Solana wallet address to receive earnings from your beat sales in USD
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProducerWalletDetailsForm
                    producerId={user.id}
                    walletAddress={producerData?.wallet_address}
                    onSuccess={handleWalletUpdateSuccess}
                  />
                </CardContent>
              </Card>
            
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl">
                    Payment Account
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Set up your bank account to receive earnings from your beat
                    sales in NGN
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProducerBankDetailsForm
                    producerId={user.id}
                    existingBankCode={producerData?.bank_code}
                    existingAccountNumber={producerData?.account_number}
                    existingAccountName={producerData?.verified_account_name}
                    onSuccess={handleBankDetailsSuccess}
                  />
                </CardContent>
              </Card>

              <PaymentStatsSection
                userId={user.id}
                hasVerifiedAccount={!!producerData?.verified_account_name}
                verifiedAccountName={producerData?.verified_account_name}
              />
            </div>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">
                  Preferences
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Customize your producer experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PreferencesForm
                  initialEmailNotifications={
                    producerSettings.emailNotifications
                  }
                  initialPushNotifications={producerSettings.pushNotifications}
                  initialSmsNotifications={producerSettings.smsNotifications}
                  initialAutoPlayPreviews={producerSettings.autoPlayPreviews}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">
                  Account Security
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Change your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside pl-2 mt-1 space-y-1">
                      <li>At least 8 characters long</li>
                      <li>At least one uppercase letter</li>
                      <li>At least one number</li>
                      <li>At least one special character</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full md:w-auto"
                  >
                    {isChangingPassword
                      ? "Updating Password..."
                      : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
