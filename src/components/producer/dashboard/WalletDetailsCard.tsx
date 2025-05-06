
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ProducerWalletDetailsForm } from "@/components/payment/ProducerWalletDetailsForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface WalletDetailsCardProps {
  userId: string;
  producerData: any;
  onSuccess: () => void;
}

export function WalletDetailsCard({
  userId,
  producerData,
  onSuccess,
}: WalletDetailsCardProps) {
  const hasWalletAddress = !!producerData?.wallet_address;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Set Up Payment Address</CardTitle>
        <CardDescription>
          Enter your Wallet details to receive automatic payments for your beat
          sales. You will receive 90% of each sale directly to your Wallet
          account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasWalletAddress && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <Info className="h-4 w-4 text-amber-500" />
            <AlertTitle>Wallet address required</AlertTitle>
            <AlertDescription>
              You need to set up your Solana wallet address to receive payments for your beats.
              Buyers won't be able to purchase your beats with USD until you complete this step.
            </AlertDescription>
          </Alert>
        )}
        
        <ProducerWalletDetailsForm
          producerId={userId}
          walletAddress={producerData?.wallet_address}
          onSuccess={() => {
            onSuccess();
          }}
        />
        
        {hasWalletAddress && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <Info className="h-4 w-4 text-green-500" />
            <AlertTitle>Wallet address configured</AlertTitle>
            <AlertDescription>
              Your wallet address is set up. You will receive payments directly to this address when customers purchase your beats with USD.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
