
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  localPrice: number;
  diasporaPrice: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  licenseType?: string;
  onClick?: () => void;
}

export function PriceTag({ 
  localPrice, 
  diasporaPrice, 
  size = "md", 
  className,
  licenseType,
  onClick
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
    sm: "text-[10px] xs:text-xs font-medium px-1.5 py-0.5 leading-normal",
    md: "text-xs sm:text-sm font-semibold px-2 py-0.5 leading-normal",
    lg: "text-sm sm:text-base font-bold px-2.5 py-0.5 leading-normal"
  };

  return (
    <span 
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center bg-primary/10 text-primary rounded-full whitespace-nowrap", 
        sizeClasses[size],
        onClick && "cursor-pointer hover:bg-primary/20 transition-colors",
        className
      )}
    >
      {licenseType && <span className="mr-1 opacity-80">{licenseType}:</span>}
      {displayPrice}
    </span>
  );
}
