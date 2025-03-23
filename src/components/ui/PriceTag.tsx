
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  localPrice: number;
  diasporaPrice: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceTag({ 
  localPrice, 
  diasporaPrice, 
  size = "md", 
  className 
}: PriceTagProps) {
  const { currency } = useAuth();
  
  const formatPrice = (price: number, currency: 'NGN' | 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(price);
  };

  const displayPrice = currency === 'NGN' 
    ? formatPrice(localPrice, 'NGN')
    : formatPrice(diasporaPrice, 'USD');

  const sizeClasses = {
    sm: "text-xs font-medium px-2 py-0.5",
    md: "text-sm font-semibold px-2.5 py-0.5",
    lg: "text-base font-bold px-3 py-1"
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center bg-primary/10 text-primary rounded-full whitespace-nowrap", 
        sizeClasses[size],
        className
      )}
    >
      {displayPrice}
    </span>
  );
}
