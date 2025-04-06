# OrderSounds - Beat Marketplace Platform

A digital marketplace for music producers to sell beats and for artists to discover and purchase high-quality beats, with automated payment splits between the platform and producers.

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [File Directory Structure](#file-directory-structure)
- [How Components Work Together](#how-components-work-together)
- [Setup Instructions](#setup-instructions)
- [Security Protocols](#security-protocols)
- [Additional Details](#additional-details)

## Project Overview

### Purpose
OrderSounds is a comprehensive music production platform where:
- Buyers can discover and purchase beats with different license types
- The platform automatically takes a 10% commission on sales
- Producers receive 90% of the sale price via Paystack's Transaction Split API
- Everything is managed through intuitive interfaces for all user types

### Key Features
- **Automated Payment Splits**: Seamless revenue sharing between platform (10%) and producers (90%)
- **Secure Payment Processing**: Integration with Paystack (NGN) and Stripe (USD)
- **User-Friendly Interfaces**:
  - Admin dashboard for managing subaccounts, splits, and transactions
  - Producer dashboard for managing beats, viewing earnings, and updating bank details
  - Buyer interface for discovering, previewing, and purchasing beats
- **Comprehensive Beat Management**: Upload, categorize, price, and manage beats with different license types
- **User Library**: Buyers can access their purchased beats, create playlists, and manage favorites
- **Following System**: Buyers can follow producers to get updates on new beats and personalized recommendations

### Target Audience
- **Buyers**: Artists looking to purchase high-quality beats for their projects
- **Producers**: Music creators selling their beats and managing their earnings
- **Admins**: Platform managers overseeing operations, users, and transactions

### Tech Stack
- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Supabase (PostgreSQL database, authentication, storage, edge functions)
- **Payment Processing**: 
  - Paystack API (NGN payments with Transaction Split API)
  - Stripe API (USD payments - planned integration)
- **State Management**: React Context API, TanStack React Query
- **Routing**: React Router
- **UI/UX**: Responsive design with mobile-first approach
- **Audio**: Custom audio player with waveform visualization

## Architecture Overview

### High-Level Architecture

OrderSounds employs a modern client-side architecture with serverless backend functions:

1. **React Frontend**: The single-page application (SPA) provides a seamless user experience
2. **Supabase Backend**: Provides authentication, database, storage, and serverless functions
3. **Paystack Integration**: Processes payments and handles revenue splitting
4. **Secure File Storage**: For hosting beat files and cover art

### Data Flow

#### Beat Purchase Flow:
1. Buyer adds a beat to cart with selected license
2. Checkout process is initiated with payment provider (Paystack for NGN)
3. If the producer has a subaccount, the Paystack Transaction Split API divides payment (10% platform, 90% producer)
4. Webhook confirms payment status and updates the database
5. Beat is added to buyer's library
6. Transaction details are recorded and available in producer's dashboard
7. Buyer receives confirmation and can download the beat

### Security
- **HTTPS**: All API calls are secured with HTTPS
- **User Authentication**: Secure authentication via Supabase Auth
- **Data Protection**: Row Level Security (RLS) policies in Supabase
- **Encryption**: Sensitive data like bank details are securely stored
- **Webhook Validation**: Secure validation of payment provider webhooks
- **Rate Limiting**: To prevent abuse of API endpoints
- **Secure Payment Processing**: Compliance with payment industry standards

## Database Schema

OrderSounds uses a PostgreSQL database through Supabase with the following key tables:

### Users
```sql
users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  full_name text,
  role text, -- 'buyer', 'producer', 'admin'
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  avatar_url text,
  stage_name text,
  bio text,
  social_links jsonb,
  bank_code text,
  account_number text,
  verified_account_name text,
  paystack_subaccount_code text,
  paystack_split_code text,
  follower_count integer DEFAULT 0
)
```

### Beats
```sql
beats (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  producer_id uuid REFERENCES users,
  price_basic numeric,
  price_premium numeric,
  price_exclusive numeric,
  genre text,
  mood text,
  tempo integer,
  key text,
  duration integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  cover_art_url text,
  audio_url text,
  preview_url text,
  published boolean,
  purchase_count integer DEFAULT 0
)
```

### User Purchased Beats
```sql
user_purchased_beats (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  beat_id uuid REFERENCES beats,
  license_type text, -- 'basic', 'premium', 'exclusive'
  purchase_date timestamp with time zone,
  order_id uuid REFERENCES orders
)
```

### User Favorites
```sql
user_favorites (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  beat_id uuid REFERENCES beats,
  added_at timestamp with time zone
)
```

### Followers
```sql
followers (
  id uuid PRIMARY KEY,
  follower_id uuid REFERENCES users, -- The user who is following (buyer)
  followee_id uuid REFERENCES users, -- The producer being followed
  created_at timestamp with time zone DEFAULT NOW(),
  UNIQUE(follower_id, followee_id)
)
```

### Orders
```sql
orders (
  id uuid PRIMARY KEY,
  buyer_id uuid REFERENCES users,
  total_price numeric,
  payment_method text, -- 'Paystack', 'Stripe'
  status text, -- 'pending', 'completed', 'failed'
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  payment_reference text,
  currency_used text -- 'NGN', 'USD'
)
```

### Line Items
```sql
line_items (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES orders,
  beat_id uuid REFERENCES beats,
  price_charged numeric,
  currency_code text, -- 'NGN', 'USD'
  created_at timestamp with time zone
)
```

### Playlists
```sql
playlists (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  name text,
  description text,
  cover_image text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  is_public boolean DEFAULT false
)
```

### Playlist Beats
```sql
playlist_beats (
  id uuid PRIMARY KEY,
  playlist_id uuid REFERENCES playlists,
  beat_id uuid REFERENCES beats,
  added_at timestamp with time zone,
  position integer
)
```

### Notifications
```sql
notifications (
  id uuid PRIMARY KEY,
  recipient_id uuid REFERENCES users,
  title text,
  body text,
  is_read boolean DEFAULT false,
  created_date timestamp with time zone DEFAULT NOW(),
  related_entity_type text, -- 'beat', 'follow', etc.
  related_entity_id uuid   -- Reference to the related entity
)
```

## File Directory Structure

### Frontend Structure

```
src/
├── components/
│   ├── auth/                 # Authentication components
│   ├── buttons/              # Reusable button components
│   │   ├── FollowButton.tsx  # Button to follow/unfollow producers
│   │   ├── ToggleFavoriteButton.tsx # Button to favorite/unfavorite beats
│   ├── filter/               # Filter components for beat discovery
│   ├── layout/               # Layout components (sidebar, header, etc.)
│   ├── library/              # Components for user's library
│   ├── marketplace/          # Components for the beat marketplace
│   │   ├── RecommendedBeats.tsx # Displays beats from followed producers
│   ├── notifications/        # Notification components
│   ├── payment/              # Payment processing components
│   ├── player/               # Audio player components
│   ├── producer/             # Producer-specific components
│   │   ├── dashboard/        # Dashboard components
│   │   │   ├── AnalyticsCharts.tsx  # Analytics visualizations
│   │   │   ├── BankDetailsCard.tsx  # Display bank information
│   │   │   ├── GenreDistribution.tsx # Genre chart
│   │   │   ├── RecentActivity.tsx   # Recent sales activity
│   │   │   ├── StatsCards.tsx       # Stats overview cards
│   │   │   ├── TopSellingBeats.tsx  # Top selling beats list
│   │   ├── profile/          # Producer profile components
│   │   │   ├── FollowerCount.tsx # Display follower count with formatting
│   ├── ui/                   # Shared UI components (shadcn)
│   ├── upload/               # Beat upload components
├── context/                  # React context providers
│   ├── AuthContext.tsx       # Authentication context
│   ├── CartContext.tsx       # Shopping cart context
│   ├── PlayerContext.tsx     # Audio player context
├── hooks/                    # Custom React hooks
│   ├── auth/                 # Authentication hooks
│   ├── library/              # Library-related hooks
│   ├── payment/              # Payment-related hooks
│   │   ├── usePaystackAdmin.ts      # Admin Paystack operations
│   │   ├── usePaystackCheckout.ts   # Checkout process
│   │   ├── usePaystackSplit.ts      # Split payment functionality
│   ├── useFollows.ts         # Hooks for follow functionality
├── integrations/             # External integrations
│   ├── supabase/             # Supabase client setup
├── lib/                      # Utility libraries
│   ├── producerStats.ts      # Producer statistics calculation
│   ├── utils.ts              # General utilities
├── pages/                    # Application pages
│   ├── admin/                # Admin pages
│   ├── auth/                 # Authentication pages
│   ├── buyer/                # Buyer-facing pages
│   │   ├── Home.tsx          # Home page with recommended beats
│   │   ├── Producers.tsx     # Page to discover and follow producers
│   ├── producer/             # Producer-facing pages
│   │   ├── ProducerProfile.tsx # Producer profile with follow button
│   ├── user/                 # User settings pages
├── types/                    # TypeScript type definitions
├── utils/                    # Utility functions
│   ├── payment/              # Payment-related utilities
│   │   ├── paystackSplitUtils.ts    # Split payment utilities
│   │   ├── paystackUtils.ts         # General Paystack utilities
├── App.tsx                   # Main application component
├── main.tsx                  # Application entry point
```

### Supabase Backend Structure

```
supabase/
├── functions/                # Edge functions
│   ├── follow-producer/      # Handle follow producer action
│   ├── unfollow-producer/    # Handle unfollow producer action
│   ├── get-follow-status/    # Check if user follows a producer
│   ├── get-recommended-beats/ # Get beats from followed producers
│   ├── paystack-split/       # Paystack split API integration
│   ├── paystack-webhook/     # Webhook handler for Paystack
│   ├── verify-paystack-payment/ # Payment verification
├── migrations/               # Database migrations
```

## How Components Work Together

### User Authentication Flow
1. Users sign up/log in via the authentication pages (`/pages/auth/*`)
2. `AuthContext.tsx` manages user state throughout the application
3. Authentication state determines available features and routes

### Beat Discovery and Purchase
1. Buyers browse beats on marketplace pages (`/pages/buyer/*`)
2. `BeatCard.tsx` displays each beat with play functionality
3. Audio preview handled by `AudioPlayer.tsx` and the `PlayerContext`
4. `AddToCartButton.tsx` adds beats to cart (managed by `CartContext`)
5. Checkout process initiated via `PaymentHandler.tsx`
6. `PaystackCheckout.tsx` handles the Paystack payment flow:
   - Validates cart items
   - Creates an order in the database
   - Initializes Paystack transaction with split code if available
   - Handles payment verification via webhook
   - Updates user's library on successful payment

### Producer Dashboard
1. Producers access their dashboard at `/pages/producer/Dashboard`
2. Stats are displayed via components in `/components/producer/dashboard/`
3. `producerStats.ts` calculates revenue, sales, and other metrics
4. Bank details are managed through `ProducerBankDetailsForm.tsx`
5. `usePaystackSplit.ts` hook handles creation of subaccounts and splits

### Payment Split System
1. Producers enter bank details via `ProducerBankDetailsForm.tsx`
2. `usePaystackSplit.ts` verifies and sends details to Paystack
3. Subaccount and split codes are stored in the user record
4. During checkout, `PaystackCheckout.tsx` uses the split code
5. Paystack automatically divides payment between platform and producer
6. Transaction records are updated via webhook confirmation

### Admin Panel
1. Admins access management tools at `/pages/admin/PaymentAdmin`
2. `usePaystackAdmin.ts` provides functions to:
   - View all subaccounts and splits
   - Update producer bank details
   - View transaction history
   - Resolve payment issues

### Following System Flow
1. The `ProducerProfile.tsx` component displays a producer's profile with their follower count and a follow button
2. The `FollowButton` component uses the `useFollows` hook to check if the current user follows the producer
3. When clicked, it calls the appropriate Supabase edge function (`follow-producer` or `unfollow-producer`)
4. The edge functions call database functions (`follow_producer` or `unfollow_producer`) to:
   - Insert/delete the follow relationship in the followers table
   - Increment/decrement the producer's follower_count
5. The `RecommendedBeats` component on the home page fetches beats from producers the user follows
6. When a producer uploads a new beat, notifications are sent to all followers via a database trigger

### User Recommendations
1. The `useFollows` hook's `useRecommendedBeats` function calls the `get-recommended-beats` edge function
2. The edge function:
   - Fetches the producers the user follows from the `followers` table
   - Gets recent beats from those producers
   - Returns the beats sorted by upload date
3. The `RecommendedBeats` component displays these beats on the home page
4. The `Producers` page allows users to discover new producers to follow, sorted by popularity

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase account
- Paystack account

### Environment Variables
Create a `.env` file with the following variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

For Supabase Edge Functions, set these secrets:
```
PAYSTACK_SECRET_KEY=your_paystack_secret_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/your-username/ordersounds.git
   cd ordersounds
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Deploy Supabase Edge Functions
   ```bash
   npx supabase functions deploy verify-paystack-payment
   npx supabase functions deploy paystack-webhook
   ```

### Testing Payments
Use Paystack's test mode and test cards:
- Test successful payment: `4123450131001381`
- Test failed payment: `4123450131001580`

## Security Protocols

### Data Protection
- **Row Level Security (RLS)**: Supabase RLS policies restrict access to data
- **Secure Storage**: Beat files and user data are securely stored
- **HTTPS**: All API communications use HTTPS

### Authentication Security
- **JWT Authentication**: Secure authentication via Supabase Auth
- **Role-Based Access Control**: Different permissions for buyers, producers, and admins

### Payment Security
- **PCI Compliance**: Payment processing handled by Paystack (PCI DSS compliant)
- **Webhook Verification**: Secure validation of Paystack webhook events
- **Payment Confirmation**: Multiple validation steps for payment verification

### Sensitive Data Handling
- **Bank Details**: Producer bank information is securely stored
- **Secure Logs**: No sensitive data in application logs

## Additional Details

### License Types
OrderSounds supports multiple license types:
1. **Basic License** - Limited usage rights for independent artists
2. **Premium License** - Extended rights with higher streaming limits
3. **Exclusive License** - Full rights with the beat removed from marketplace
4. **Custom License** - Tailored terms negotiated between producer and artist

### API Integrations
- **Paystack**: Payment processing with Transaction Split API
- **Supabase**: Database, authentication, and storage
- **Stripe**: Planned integration for USD payments

### Known Limitations
- Currently supports NGN currency; USD support via Stripe is planned
- Webhook processing may experience delays during high traffic periods

### Roadmap
- Stripe integration for USD payments
- Advanced analytics for producers
- Mobile application
- Collaborative features for producers
- AI-powered beat recommendations

### Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### License
This project is licensed under the MIT License - see the LICENSE file for details.

### Followers and Recommendations System
OrderSounds implements a comprehensive followers system:
1. **Follow Relationships**: Buyers can follow producers (but producers cannot follow others)
2. **Database Structure**: 
   - `followers` table stores relationships between users
   - `follower_count` on users table for fast access (denormalized)
3. **Security**:
   - Row Level Security ensures users can only manage their own follows
   - Database functions for atomic operations and validation
4. **Personalized Experience**:
   - Recommended beats from followed producers on home page
   - Notifications when followed producers release new beats
5. **Performance Optimizations**:
   - Indexes on follower_id and followee_id columns
   - Follower count stored on user record to avoid expensive COUNT queries
   - React Query for client-side caching and invalidation
