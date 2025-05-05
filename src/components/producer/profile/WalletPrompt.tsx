
import { Wallet } from "lucide-react";

const WalletPrompt = () => {
  return (
    <div className="mb-6 p-4 border border-amber-300 bg-amber-50 rounded-lg">
      <h3 className="font-semibold flex items-center text-amber-800">
        <Wallet className="w-5 h-5 mr-2" />
        Set up your wallet address
      </h3>
      <p className="text-sm text-amber-700 mt-1">
        Please add your wallet address in the Producer Settings tab to receive payments from your sales.
      </p>
    </div>
  );
};

export default WalletPrompt;
