
import { Beat } from '@/types';

/**
 * Calculates the price for a specific license type based on the beat and user location
 * @param beat The beat object
 * @param licenseType The type of license: 'basic', 'premium', 'exclusive' or custom
 * @param isDiaspora Whether to use diaspora (USD) pricing or local (NGN) pricing
 * @returns The calculated price for the license
 */
export const getLicensePrice = (
  beat: Beat | undefined, 
  licenseType: string = 'basic', 
  isDiaspora: boolean = false
): number => {
  if (!beat) return 0;
  
  const fallbackMultipliers = {
    basic: 0.5,
    premium: 1,
    exclusive: 3
  };

  // Handle custom license types
  if (licenseType && !['basic', 'premium', 'exclusive'].includes(licenseType)) {
    return isDiaspora ? beat.price_diaspora : beat.price_local;
  }

  if (isDiaspora) {
    // Diaspora pricing (USD)
    switch (licenseType) {
      case 'basic':
        return beat.basic_license_price_diaspora || beat.price_diaspora * fallbackMultipliers.basic;
      case 'premium':
        return beat.premium_license_price_diaspora || beat.price_diaspora * fallbackMultipliers.premium;
      case 'exclusive':
        return beat.exclusive_license_price_diaspora || beat.price_diaspora * fallbackMultipliers.exclusive;
      default:
        return beat.price_diaspora;
    }
  } else {
    // Local pricing (NGN)
    switch (licenseType) {
      case 'basic':
        return beat.basic_license_price_local || beat.price_local * fallbackMultipliers.basic;
      case 'premium':
        return beat.premium_license_price_local || beat.price_local * fallbackMultipliers.premium;
      case 'exclusive':
        return beat.exclusive_license_price_local || beat.price_local * fallbackMultipliers.exclusive;
      default:
        return beat.price_local;
    }
  }
};
