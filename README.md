
# Creacove - Beat Marketplace Platform

![Creacove Banner](https://images.unsplash.com/photo-1549213783-8284d0336c4f?q=80&w=1470&auto=format&fit=crop)

## Project Overview

Creacove is a sophisticated beat marketplace platform designed to connect music producers with buyers. The platform serves two distinct user flows:

**Producer Flow**: Music producers can upload, manage, and sell their beats with advanced features like royalty splits, dual pricing, and detailed analytics.

**Buyer Flow**: Artists and content creators can discover, preview, purchase, and organize beats for their projects.

### Core Features

- **Dual-Currency Marketplace**: Supports both Nigerian Naira (NGN) and US Dollar (USD) pricing
- **Beat Management**: Upload, organize, and categorize beats with detailed metadata
- **Royalty Split System**: Allow producers to define collaborator shares for each beat
- **Personalized Dashboards**: Tailored experiences for both producers and buyers
- **Playlist Creation**: Organize beats into custom playlists
- **Secure Payments**: Integrated with Stripe and Paystack payment gateways
- **Analytics & Insights**: Track sales, plays, and user engagement
- **User Authentication**: Secure login and registration systems

## Architecture & Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Routing**: React Router
- **API Requests**: Tanstack React Query

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for beat files and images
- **API Layer**: Supabase API and custom Edge Functions
- **Real-time Features**: Supabase Realtime

## User Flows & Dashboards

### Buyer Dashboard

**Navigation**: 
- Home/Discover: Trending beats, new releases, and personalized recommendations
- Trending: Currently popular beats across the platform
- New: Recently uploaded beats
- Playlists: User-created and featured playlists
- Genres: Browse beats by musical genre
- Producers: Discover and follow producers
- Charts: Top-performing beats in different categories
- Library: Access favorites, purchased beats, and created playlists
- Orders: View purchase history and receipts
- Settings: Account and profile management

**Core Interactions**:
- Discover beats through search and browsing
- Preview beats before purchase
- Add beats to cart and complete checkout
- Create and manage playlists
- Follow favorite producers
- View purchase history

### Producer Dashboard

**Navigation**:
- Dashboard: Overview of sales, plays, and analytics
- Beats: Manage uploaded beats
- Upload: Add new beats to the platform
- Royalties: Track earnings and manage splits
- Settings: Account, profile, and payout settings

**Core Interactions**:
- Upload and manage beats with detailed metadata
- Set pricing in dual currencies (NGN/USD)
- Define royalty splits with collaborators
- Track sales and analytics
- Manage profile and payout information

## Database Schema Overview

### Main Tables

- **users**: User profiles, authentication details, and preferences
- **beats**: Beat metadata, file locations, and pricing information
- **orders**: Purchase records with payment details
- **line_items**: Individual beat purchases within orders
- **playlists**: User-created collections of beats
- **royalty_splits**: Collaborator shares for beat royalties
- **notifications**: System and user notifications
- **user_purchased_beats**: Records of beats purchased by users

### Key Relationships

- Users can be either buyers or producers (or both)
- Producers create beats and define royalty splits
- Buyers create orders containing line items (beats)
- Users create playlists containing references to beats
- Notifications are sent to users based on various events

## API & Integration Details

### Authentication
- Email/password authentication via Supabase Auth
- Session management and secure token handling
- Role-based access control (buyer vs. producer)

### File Storage
- Audio files stored in Supabase Storage
- Separate storage for full tracks and preview clips
- Cover images for beats and user profiles

### Real-time Updates
- Live notifications for purchases and system events
- Real-time analytics updates for producers

### Payment Processing
- **Stripe**: International payments in USD
- **Paystack**: Local payments in NGN
- Secure checkout flow with confirmation

## Development & Deployment Guidelines

### Local Development Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd creacove

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

For local development, ensure you have the following in your .env file:

```
VITE_SUPABASE_URL=https://uoezlwkxhbzajdivrlby.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXpsd2t4aGJ6YWpkaXZybGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3Mzg5MzAsImV4cCI6MjA1ODMxNDkzMH0.TwIkGiLNiuxTdzbAxv6zBgbK1zIeNkhZ6qeX6OmhWOk
```

### Deployment

The application can be deployed to any static hosting provider. For production deployments:

1. Build the application: `npm run build`
2. Deploy the contents of the `dist` directory to your hosting provider
3. Configure proper redirects for the SPA routing

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## Changelog

### [v0.1.0] - 2025-03-23
- Initial project setup with React, Vite, and Supabase
- Implemented user authentication (signup, login, logout)
- Created buyer and producer dashboard layouts
- Set up database schema with initial tables
- Added dual-currency support (NGN/USD)
- Implemented basic beat browsing functionality

