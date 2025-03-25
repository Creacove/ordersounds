
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  localPrice: number;
  diasporaPrice: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  licenseType?: string;
  onClick?: (e: React.MouseEvent) => void;
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
    ? formatPrice(localPrice || 0, 'NGN')
    : formatPrice(diasporaPrice || 0, 'USD');

  const sizeClasses = {
    sm: "text-xs sm:text-sm font-medium px-1.5 py-0.5 leading-normal",
    md: "text-sm sm:text-base font-semibold px-2 py-0.5 leading-normal",
    lg: "text-base sm:text-lg font-bold px-2.5 py-0.5 leading-normal"
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <span 
      onClick={handleClick}
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
