
import { Beat } from "@/types";

export interface BeatCardProps {
  beat: Beat;
  isInCart?: boolean;
  onAddToCart?: () => void;
  showLicenseSelector?: boolean;
  featured?: boolean;
}
