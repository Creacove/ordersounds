
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProducerBankDetailsForm } from "@/components/payment/ProducerBankDetailsForm";

interface BankDetailsCardProps {
  userId: string;
  producerData: any;
  onSuccess: () => void;
}

export function BankDetailsCard({ userId, producerData, onSuccess }: BankDetailsCardProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Set Up Payment Account</CardTitle>
        <CardDescription>
          Enter your bank details to receive automatic payments for your beat sales.
          You will receive 90% of each sale directly to your bank account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProducerBankDetailsForm 
          producerId={userId}
          existingBankCode={producerData?.bank_code}
          existingAccountNumber={producerData?.account_number}
          existingAccountName={producerData?.verified_account_name}
          onSuccess={onSuccess}
        />
      </CardContent>
    </Card>
  );
}
