# Fullscreenify - Project Brief

## Executive Summary

Fullscreenify is a web application that provides an immersive music visualization experience by displaying the album artwork of a user's currently playing Spotify songs in fullscreen mode. The application offers both a standard album art view and an animated CD display option, along with playback controls and various UI customization features.

The app integrates with the Spotify Web API to fetch real-time playback information, including album artwork, track names, and artist information. It features Spotify OAuth authentication, automatic token refresh mechanisms, and session management to provide a seamless user experience.

## Core Functionality

### Authentication & Authorization
- OAuth 2.0 integration with Spotify
- Automatic access token management and refresh
- Session expiration handling
- Persistent login across sessions via secure storage
- Secure logout functionality
- User accounts and preferences management via Supabase

### Spotify Integration
- Real-time currently playing track information retrieval
- Playback controls (play, pause, previous, next)
- Error handling for API responses
- Adaptive polling frequency based on playback state

### User Interface
- Fullscreen album artwork display
- Animated spinning CD visualization mode
- Blurred background effect using the album artwork
- Text overlay with song and artist information
- Interactive UI with hover effects
- Responsive design for various screen sizes
- Keyboard shortcuts for common actions
- Smart cursor hiding during inactivity
- Hide UI option for distraction-free viewing

### Device Management
- Wake Lock API integration to prevent screen sleep
- Visibility change detection for background/foreground app states
- Fullscreen mode toggle

## Technology Stack

### Frontend
- React.js for UI components
- Next.js framework for SSR, routing, and API routes
- TypeScript for type safety
- CSS Modules or Tailwind CSS for styling
- Framer Motion for animations
- React Icons or similar icon library

### Backend Services
- Supabase for authentication, database, and storage
- Next.js API routes for server-side operations
- Edge functions for global performance

### APIs & Libraries
- Spotify Web API
- Web Authentication API
- Supabase Auth
- Screen Wake Lock API
- Fullscreen API

### Deployment & Infrastructure
- Vercel for hosting and deployment
- GitHub for version control
- GitHub Actions for CI/CD workflows
- Vercel Analytics for performance monitoring

## Architecture Overview

The application is structured following Next.js best practices with a modern React architecture:

### Key Structure

```
/
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── player/           # Main player component
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/               # UI components
│   ├── player/           # Player-specific components
│   └── auth/             # Auth components 
├── lib/                  # Utility functions
│   ├── spotify.ts        # Spotify API client
│   ├── supabase.ts       # Supabase client
│   └── hooks/            # Custom React hooks
├── styles/               # Global styles
├── public/               # Static assets
│   ├── fonts/
│   └── images/
└── package.json
```

### Authentication Flow

1. User visits the site and sees a login screen
2. User clicks "Login with Spotify" button
3. App uses Supabase Auth with Spotify OAuth provider
4. User grants permission on Spotify's site
5. Spotify redirects back to our application
6. Supabase securely manages tokens and sessions
7. App uses secure HTTP-only cookies for session management
8. Refresh tokens are handled automatically by Supabase

### Data Flow

1. React Query or SWR manages API data fetching with intelligent caching
2. Server-side API routes proxy Spotify API requests for security
3. Real-time Supabase subscriptions track user preferences
4. UI updates occur through React state management
5. React Context or lightweight state management for global state

## Production Development Guide

### 1. Project Setup

1. Create a new Next.js project with TypeScript:
   ```bash
   npx create-next-app@latest fullscreenify --typescript
   ```

2. Set up Supabase project:
   - Create a new Supabase project
   - Configure OAuth provider for Spotify
   - Create necessary database tables for user preferences

3. Register a new application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/):
   - Add your production domain as a Redirect URI
   - Note your Client ID for use in the application

4. Configure environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SPOTIFY_CLIENT_ID=your-spotify-client-id
   SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
   ```

### 2. Authentication Implementation

1. Implement Supabase Auth with Spotify OAuth:
   - Set up Spotify as an OAuth provider in Supabase
   - Create auth UI components using Supabase Auth UI library
   - Implement protected routes with middleware

2. Create custom hooks for auth management:
   ```tsx
   export const useAuth = () => {
     const [session, setSession] = useState(null);
     const supabase = useSupabaseClient();
     
     useEffect(() => {
       // Set up auth subscription
       const { data } = supabase.auth.onAuthStateChange(
         (event, session) => {
           setSession(session);
         }
       );
       
       return () => data.subscription.unsubscribe();
     }, [supabase]);
     
     return { session, isAuthenticated: !!session };
   };
   ```

3. Set up Next.js middleware for route protection:
   ```ts
   // middleware.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

   export async function middleware(req: NextRequest) {
     const res = NextResponse.next();
     const supabase = createMiddlewareClient({ req, res });
     const { data: { session } } = await supabase.auth.getSession();
     
     if (!session && req.nextUrl.pathname.startsWith('/player')) {
       return NextResponse.redirect(new URL('/auth/login', req.url));
     }
     
     return res;
   }
   ```

### 3. API Integration

1. Create a Spotify API client using React Query:
   ```tsx
   // lib/spotify.ts
   import { useQuery } from '@tanstack/react-query';

   export const useCurrentlyPlaying = () => {
     return useQuery({
       queryKey: ['currently-playing'],
       queryFn: async () => {
         const response = await fetch('/api/spotify/currently-playing');
         if (!response.ok) throw new Error('Failed to fetch');
         return response.json();
       },
       refetchInterval: (data) => data?.is_playing ? 1000 : 5000,
     });
   };
   ```

2. Implement Next.js API routes for Spotify interaction:
   ```tsx
   // app/api/spotify/currently-playing/route.ts
   import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
   import { cookies } from 'next/headers';
   import { NextResponse } from 'next/server';

   export async function GET() {
     const supabase = createRouteHandlerClient({ cookies });
     const { data: { session } } = await supabase.auth.getSession();
     
     if (!session) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }
     
     const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
       headers: {
         Authorization: `Bearer ${session.provider_token}`
       }
     });
     
     if (response.status === 204) {
       return NextResponse.json({ is_playing: false });
     }
     
     const data = await response.json();
     return NextResponse.json(data);
   }
   ```

3. Create playback control API endpoints:
   - Implement API routes for play, pause, next, previous
   - Use React Query mutations for state updates

### 4. Core Application 

1. Build React components for UI elements:
   - AlbumView component
   - CDView component with Framer Motion animations
   - Controls component with playback buttons
   - Settings component for user preferences

2. Implement client-side hooks for features:
   ```tsx
   // hooks/useFullscreen.ts
   export const useFullscreen = () => {
     const [isFullscreen, setIsFullscreen] = useState(false);
     
     const toggleFullscreen = () => {
       if (!document.fullscreenElement) {
         document.documentElement.requestFullscreen();
         setIsFullscreen(true);
       } else {
         document.exitFullscreen();
         setIsFullscreen(false);
       }
     };
     
     useEffect(() => {
       const handleChange = () => {
         setIsFullscreen(!!document.fullscreenElement);
       };
       
       document.addEventListener('fullscreenchange', handleChange);
       return () => document.removeEventListener('fullscreenchange', handleChange);
     }, []);
     
     return { isFullscreen, toggleFullscreen };
   };
   ```

3. Store user preferences in Supabase:
   - Create a user_preferences table
   - Sync preferences across devices
   - Implement real-time updates with Supabase subscriptions

### 5. Performance Optimizations

1. Next.js-specific optimizations:
   - Use Next.js Image component for optimized images
   - Implement ISR (Incremental Static Regeneration) where appropriate
   - Use Next.js font optimization
   - Configure image domains in next.config.js

2. React optimizations:
   - Use React.memo for expensive components
   - Implement virtualization for long lists (if needed)
   - Use dynamic imports for code splitting
   - Optimize context to prevent unnecessary re-renders

3. Asset optimizations:
   - Implement responsive images with Next.js Image
   - Use modern image formats (WebP, AVIF)
   - Preload critical assets

### 6. Enhanced User Experience

1. Add transitions and animations with Framer Motion:
   ```tsx
   <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     exit={{ opacity: 0 }}
     transition={{ duration: 0.5 }}
   >
     {/* Album artwork */}
   </motion.div>
   ```

2. Implement intelligent background processing:
   - Use React Query's background fetching
   - Implement stale-while-revalidate pattern
   - Pre-fetch next track's information

3. Add customization options stored in Supabase:
   - Theme selection (light/dark mode)
   - Animation speed controls
   - UI density options
   - Persistence of user preferences across devices

### 7. Accessibility Improvements

1. Implement React-specific accessibility features:
   - Use semantic HTML elements
   - Implement focus management with useRef and focus trapping
   - Ensure keyboard navigation works properly

2. Add comprehensive ARIA attributes:
   ```tsx
   <button
     aria-label={isPlaying ? 'Pause' : 'Play'}
     aria-pressed={isPlaying}
     onClick={togglePlayback}
   >
     {isPlaying ? <PauseIcon /> : <PlayIcon />}
   </button>
   ```

3. Use Next.js's built-in accessibility features

### 8. Analytics and Monitoring

1. Implement Vercel Analytics:
   - Set up Web Vitals reporting
   - Track custom events
   - Monitor Core Web Vitals

2. Create custom event tracking with Supabase:
   - Log user interactions
   - Track feature usage
   - Create analytics dashboard

### 9. Testing Strategy

1. Implement unit tests with Jest and React Testing Library:
   ```tsx
   // components/Player.test.tsx
   import { render, screen } from '@testing-library/react';
   import Player from './Player';
   
   test('displays album artwork when song is playing', () => {
     render(<Player song={{ album: { images: [{ url: 'test.jpg' }] } }} />);
     const image = screen.getByAltText('Album cover');
     expect(image).toBeInTheDocument();
   });
   ```

2. Add end-to-end tests with Playwright:
   - Test critical user flows
   - Test authentication
   - Test playback controls

3. Implement API mocking for tests:
   - Mock Spotify API responses
   - Create test fixtures

### 10. Deployment with Vercel

1. Set up Vercel deployment:
   - Connect GitHub repository to Vercel
   - Configure environment variables
   - Set up preview deployments for PRs

2. Implement CI/CD with GitHub Actions:
   - Run tests before deployment
   - Lint code
   - Type checking

3. Configure Vercel-specific optimizations:
   - Edge Functions for global performance
   - Image Optimization
   - Serverless Functions
   - Automatic HTTPS and SSL

## Key Improvements for Production

1. **Security**:
   - Leverage Supabase Auth for secure authentication
   - Implement proper CSRF protection
   - Add Content Security Policy
   - Use Next.js API routes as a secure proxy for Spotify API calls

2. **Performance**:
   - Use Next.js Image component and font optimization
   - Implement Suspense and React.lazy for code splitting
   - Use Edge Functions for global performance
   - Leverage Vercel's global CDN

3. **User Experience**:
   - Implement smooth transitions with Framer Motion
   - Add proper error boundaries with React Error Boundary
   - Create a PWA with Next.js PWA module
   - Add offline support with service workers

4. **Scalability**:
   - Use Supabase for real-time database capabilities
   - Implement internationalization with next-intl
   - Design a modular component system
   - Create feature flags stored in Supabase

## Conclusion

Fullscreenify demonstrates how a seemingly simple concept can be enhanced with thoughtful UX design and modern web technologies. By leveraging Next.js, React, Vercel, and Supabase, developers can create a production-ready version that significantly improves upon the original prototype while maintaining its core appeal of providing an immersive music visualization experience.

The modern tech stack offers several advantages:
- **Next.js**: Provides optimized rendering, simplified routing, and built-in API routes
- **React**: Enables component-based architecture and efficient UI updates
- **Vercel**: Offers seamless deployment, global CDN, and analytics
- **Supabase**: Provides authentication, database, and real-time capabilities without managing infrastructure

The key to success will be maintaining the simplicity and immediacy of the original concept while enhancing it with better performance, security, and additional features that add value without complexity. 