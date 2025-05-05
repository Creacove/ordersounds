
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ProducerWalletDetailsForm } from "@/components/payment/ProducerWalletDetailsForm";

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
        <ProducerWalletDetailsForm
          producerId={userId}
          walletAddress={producerData?.wallet_address}
          onSuccess={onSuccess}
        />
      </CardContent>
    </Card>
  );
}
