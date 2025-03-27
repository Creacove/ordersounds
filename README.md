# OrderSounds - Beat Marketplace

A digital marketplace for music producers to sell beats and for artists to discover and purchase high-quality beats.

## Features

### For Producers
- Upload and manage beats
- Set different license types and pricing
- Track sales and analyze performance
- Manage royalty splits with collaborators
- Receive payments directly to your account

### For Artists
- Discover trending and new beats
- Add favorites and create playlists
- Purchase beats with different license options
- Download purchased beats
- Keep track of your purchases in your library

## Purchase Flow

When a user purchases a beat:

1. The beat is added to the cart with the selected license type
2. User proceeds to checkout
3. Payment is processed securely through Paystack (NGN) or Stripe (USD)
4. Upon successful payment:
   - The beat is added to the user's library
   - User receives a notification confirming the purchase
   - User can immediately download the full-quality audio file
   - Purchase is recorded in the user's order history
   - The beat's purchase count is incremented
   - The producer gets credited for the sale

## Technical Stack

- Frontend: React, TypeScript, TailwindCSS
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Payment: Paystack, Stripe
- Audio: Custom audio player with waveform visualization

## License Types

OrderSounds supports multiple license types:

1. **Basic License** - Limited usage rights for independent artists
2. **Premium License** - Extended rights with higher streaming limits
3. **Exclusive License** - Full rights with the beat removed from marketplace
4. **Custom License** - Tailored terms negotiated between producer and artist

## Installation and Setup

[Include installation instructions]

## Contributing

[Include contribution guidelines]

## License

[Include license information]
