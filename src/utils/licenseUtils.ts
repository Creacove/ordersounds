
export const getLicensePrice = (
  beat: any, 
  licenseType: 'basic' | 'premium' | 'exclusive' | 'custom' | string, 
  isDiaspora: boolean
): number => {
  // For diaspora pricing (USD)
  if (isDiaspora) {
    switch (licenseType) {
      case 'basic':
        return beat.basic_license_price_diaspora ?? beat.price_diaspora ?? 0;
      case 'premium':
        return beat.premium_license_price_diaspora ?? (beat.price_diaspora ? beat.price_diaspora * 1.5 : 0);
      case 'exclusive':
        return beat.exclusive_license_price_diaspora ?? (beat.price_diaspora ? beat.price_diaspora * 3 : 0);
      case 'custom':
        return beat.custom_license_price_diaspora ?? beat.price_diaspora ?? 0;
      default:
        return beat.price_diaspora ?? 0;
    }
  }
  
  // For local pricing (NGN)
  switch (licenseType) {
    case 'basic':
      return beat.basic_license_price_local ?? beat.price_local ?? 0;
    case 'premium':
      return beat.premium_license_price_local ?? (beat.price_local ? beat.price_local * 1.5 : 0);
    case 'exclusive':
      return beat.exclusive_license_price_local ?? (beat.price_local ? beat.price_local * 3 : 0);
    case 'custom':
      return beat.custom_license_price_local ?? beat.price_local ?? 0;
    default:
      return beat.price_local ?? 0;
  }
};
