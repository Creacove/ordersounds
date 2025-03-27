
# OrderSOUNDS - Beat Marketplace Platform

![OrderSOUNDS Banner](https://images.unsplash.com/photo-1549213783-8284d0336c4f?q=80&w=1470&auto=format&fit=crop)

## Project Overview

OrderSOUNDS is a sophisticated beat marketplace platform designed to connect music producers with buyers. The platform serves two distinct user flows:

**Producer Flow**: Music producers can upload, manage, and sell their beats with advanced features like royalty splits, dual pricing, and detailed analytics.

**Buyer Flow**: Artists and content creators can discover, preview, purchase, and organize beats for their projects.

## Table of Contents
- [Core Features](#core-features)
- [Architecture & Technology Stack](#architecture--technology-stack)
- [File Structure & Codebase Overview](#file-structure--codebase-overview)
- [Database Schema](#database-schema)
- [User Flows & Dashboards](#user-flows--dashboards)
- [Design & UI Components](#design--ui-components)
- [Development Setup](#development-setup)
- [Deployment Guidelines](#deployment-guidelines)
- [Contributing](#contributing)
- [Changelog](#changelog)

## Core Features

- **Dual-Currency Marketplace**: Supports both Nigerian Naira (NGN) and US Dollar (USD) pricing
- **Beat Management**: Upload, organize, and categorize beats with detailed metadata
- **Royalty Split System**: Allow producers to define collaborator shares for each beat
- **Personalized Dashboards**: Tailored experiences for both producers and buyers
- **Playlist Creation**: Organize beats into custom playlists
- **Secure Payments**: Integrated with Stripe and Paystack payment gateways
- **Analytics & Insights**: Track sales, plays, and user engagement
- **User Authentication**: Secure login and registration systems
- **Notifications**: Real-time notifications for purchases, messages, and platform updates

## Architecture & Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Routing**: React Router
- **API Requests**: Tanstack React Query
- **Notifications**: Real-time notifications using Supabase Realtime

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for beat files and images
- **API Layer**: Supabase API and custom Edge Functions
- **Real-time Features**: Supabase Realtime
- **Email Notifications**: Integrated email notification system

## File Structure & Codebase Overview

### Key Directories

#### `/src` - Source Code Root
Contains all application source code.

#### `/src/components` - UI Components
- **`/layout`**: Core layout components like Sidebar, Topbar, and MainLayout that provide the application structure.
- **`/ui`**: Reusable UI components built on shadcn/ui like buttons, cards, and dialogs.
- **`/player`**: Audio player components for beat preview and playback.
- **`/library`**: Components related to user libraries and playlists.
- **`/filter`**: Components for filtering and searching beats.
- **`/upload`**: Components for uploading and managing beats.

#### `/src/context` - Application State
- **`AuthContext.tsx`**: Manages user authentication state and methods.
- **`CartContext.tsx`**: Handles shopping cart functionality.
- **`PlayerContext.tsx`**: Controls audio playback state across the application.

#### `/src/pages` - Route Components
- **`/auth`**: Authentication pages (login, signup).
- **`/buyer`**: Pages for the buyer experience (home, discover, playlists).
- **`/producer`**: Pages for producer dashboard and management.
- **`/user`**: User profile and settings pages.

#### `/src/hooks` - Custom React Hooks
- **`/auth`**: Authentication-related hooks like useAuthState and useAuthMethods.
- **`useBeats.tsx`**: Hook for fetching and managing beat data.
- **`useAudio.tsx`**: Hook for controlling audio playback.
- **`useBeatUpload.ts`**: Hook for uploading beats.
- **`use-mobile.tsx`**: Hook for responsive design features.

#### `/src/lib` - Utility Functions
- **`supabase.ts`**: Supabase client configuration.
- **`storage.ts`**: Functions for file storage operations.
- **`utils.ts`**: General utility functions.
- **`playlistService.ts`**: Functions for playlist operations.
- **`beatStorage.ts`**: Functions for beat file storage.

#### `/src/integrations` - External Services
- **`/supabase`**: Supabase integration files including database client and types.

#### `/src/types` - TypeScript Type Definitions
Type definitions for the application entities like User, Beat, Playlist, etc.

#### `/public` - Static Assets
Contains static files like favicons and SVGs.

### Key Files

#### `App.tsx`
The application entry point that sets up routing, authentication, and global contexts. It defines all routes for the application and wraps components with necessary providers.

#### `main.tsx`
The application bootstrap file that renders the App component to the DOM.

#### `index.html`
The HTML entry point for the application with meta tags and title configurations.

#### `vite.config.ts`
Vite configuration file that sets up the build environment, aliases, and plugins.

## Database Schema

### Main Tables

#### `users`
Stores user profiles and authentication information:
- `id`: Unique identifier (UUID)
- `email`: User email address
- `role`: User role ('buyer' or 'producer')
- `full_name`: User's full name
- `profile_picture`: URL to profile image
- `bio`: User biography
- `country`: User's country
- `stage_name`: Producer's stage name (for producers)
- Various flags and settings

#### `beats`
Stores beat metadata and file references:
- `id`: Unique identifier (UUID)
- `producer_id`: Reference to user who created the beat
- `title`: Beat title
- `description`: Beat description
- `genre`, `track_type`, `bpm`, `key`: Music metadata
- `cover_image`: Beat artwork URL
- `audio_preview`: URL to preview audio file
- `audio_file`: URL to full audio file
- `price_local`: Price in NGN
- `price_diaspora`: Price in USD
- `status`: Beat status (draft/published)
- Various license-related fields and counts

#### `playlists`
User-created beat collections:
- `id`: Unique identifier (UUID)
- `owner_id`: User who created the playlist
- `name`: Playlist name
- `beats`: Array of beat IDs
- `cover_image`: Playlist artwork URL
- `is_public`: Visibility flag

#### `orders`
Purchase records:
- `id`: Unique identifier (UUID)
- `buyer_id`: User who made the purchase
- `total_price`: Total amount
- `currency_used`: Currency code (NGN/USD)
- `payment_method`: Payment provider used
- `status`: Order status

#### `line_items`
Individual items within orders:
- `id`: Unique identifier (UUID)
- `order_id`: Reference to parent order
- `beat_id`: Beat that was purchased
- `price_charged`: Amount charged
- `currency_code`: Currency code (NGN/USD)

#### `user_purchased_beats`
Records of beats purchased by users:
- `id`: Unique identifier (UUID)
- `user_id`: User who purchased the beat
- `beat_id`: Beat that was purchased
- `order_id`: Reference to the order
- `license_type`: Type of license purchased
- `currency_code`: Currency used for purchase

#### `royalty_splits`
Defines collaborator shares for beats:
- `id`: Unique identifier (UUID)
- `beat_id`: Reference to the beat
- `party_id`: Collaborator user ID
- `party_name`: Collaborator name
- `party_email`: Collaborator email
- `party_role`: Collaborator role
- `percentage`: Royalty percentage

#### `notifications`
System and user notifications:
- `id`: Unique identifier (UUID)
- `recipient_id`: User receiving the notification
- `title`: Notification title
- `body`: Notification content
- `is_read`: Read status flag

### Key Relationships
- **One-to-Many**: User to Beats (producer creates many beats)
- **One-to-Many**: User to Playlists (user creates many playlists)
- **One-to-Many**: User to Orders (user places many orders)
- **Many-to-Many**: Beats to Playlists (beats can be in multiple playlists)
- **Many-to-Many**: Users to Beats via purchases (users can buy multiple beats)

### Row-Level Security
Row-Level Security (RLS) policies ensure that:
- Users can only access their own profile data
- Users can only modify their own content (playlists, orders)
- Beat metadata is publicly readable, but full tracks require purchase
- Producers can only manage their own beats and see their own royalty information

## User Flows & Dashboards

### Buyer Dashboard

**Navigation**: 
- Home/Discover: Trending beats, new releases, and recommendations
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
- Receive notifications for new releases and updates

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
- Receive notifications for sales and collaborations

## Design & UI Components

### Color Palette
- **Primary Purple**: #9b87f5
- **Secondary Purple**: #7E69AB
- **Tertiary Purple**: #6E59A5
- **Dark Purple**: #1A1F2C
- **Light Purple**: #D6BCFA
- **Accent Colors**: 
  - Soft Green: #F2FCE2
  - Soft Pink: #FFDEE2
  - Soft Blue: #D3E4FD
  - Vivid Purple: #8B5CF6
  - Bright Orange: #F97316

### Key UI Components

#### Layout Components
- **Topbar**: Navigation, search, user menu, and currency toggle
- **Sidebar**: Main navigation menu, split by user role
- **MainLayout**: Container that combines sidebar and main content
- **MainLayoutWithPlayer**: Layout with persistent audio player

#### Content Components
- **BeatCard**: Card display for beats with cover art and metadata
- **BeatListItem**: List item display for beats in playlists and search results
- **PlaylistCard**: Card display for playlists
- **AudioPlayer**: Beat preview and playback controls
- **PersistentPlayer**: Sticky player that remains visible while browsing

#### Form Components
- **DetailTab**: Beat metadata input form
- **FilesTab**: File upload interface for beats
- **PricingTab**: Price setting interface for beats
- **LicensingTab**: License terms configuration
- **RoyaltiesTab**: Royalty split definition interface

### Responsive Design
The application is fully responsive, adapting to:
- Desktop screens (1024px+)
- Tablets (768px-1023px)
- Mobile devices (<768px)

UI components adjust their layout and visibility based on screen size, and the sidebar collapses to a mobile menu on smaller screens.

## Development Setup

### Prerequisites
- Node.js 16+ or Bun 1.0+
- Git
- Supabase account (for backend)

### Environment Variables
Create a `.env` file in the project root with the following:

```
VITE_SUPABASE_URL=https://uoezlwkxhbzajdivrlby.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXpsd2t4aGJ6YWpkaXZybGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3Mzg5MzAsImV4cCI6MjA1ODMxNDkzMH0.TwIkGiLNiuxTdzbAxv6zBgbK1zIeNkhZ6qeX6OmhWOk
```

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd ordersounds

# Install dependencies
npm install
# or if using Bun
bun install
```

### Development Server

```bash
# Start development server
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:8080`.

### Building for Production

```bash
# Build the application
npm run build
# or
bun run build

# Preview the production build
npm run preview
# or
bun run preview
```

### Testing

```bash
# Run tests
npm test
# or
bun test
```

## Deployment Guidelines

### Build Output
The build process generates optimized files in the `dist` directory, which can be deployed to any static hosting service.

### Hosting Recommendations
- **Vercel**: Good for React applications with serverless functions
- **Netlify**: Simple deployment with continuous integration
- **Cloudflare Pages**: Fast global CDN with free tier

### Deployment Steps
1. Build the application: `npm run build`
2. Configure hosting provider with Supabase environment variables
3. Deploy the `dist` directory to your hosting provider
4. Set up proper redirects for client-side routing (`_redirects` file for Netlify, `vercel.json` for Vercel)

## Contributing

### Code Style
- Follow the existing code style with TypeScript
- Use Prettier for code formatting
- Keep components focused and small (under 300 lines)
- Write descriptive comments for complex logic

### Branch Strategy
- `main`: Production-ready code
- `develop`: Active development branch
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/issue-description`

### Pull Request Process
1. Create a branch from `develop`
2. Implement your changes
3. Add tests if applicable
4. Update documentation
5. Submit a pull request to `develop`

### Best Practices
- Keep components modular and reusable
- Use TypeScript types consistently
- Follow the shadcn/ui component pattern
- Update the README for significant changes

## Changelog

### [v0.3.0] - 2025-04-15
- Consolidated profile and settings pages
- Improved navigation and user flow
- Integrated real-time notifications
- Fixed bugs in playlist management
- Enhanced mobile responsiveness

### [v0.2.0] - 2025-04-02
- Implemented notifications system
- Enhanced royalty splits management
- Added real-time updates for producers
- Improved UI/UX for beat discovery
- Fixed various bugs and performance issues

### [v0.1.0] - 2025-03-23
- Initial project setup with React, Vite, and Supabase
- Implemented user authentication (signup, login, logout)
- Created buyer and producer dashboard layouts
- Set up database schema with initial tables
- Added dual-currency support (NGN/USD)
- Implemented basic beat browsing functionality
