import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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
        <CardTitle>Set Up Payment Wallet</CardTitle>
        <CardDescription>
          Enter ypur wallet address to receive automatic payments for your beat
          sales. You will receive 90% of each sale directly to your wallet address.
        </CardDescription>
      </CardHeader>
      <CardContent>
       
      </CardContent>
    </Card>
  );
}
