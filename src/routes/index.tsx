import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedLayout } from '../components/ProtectedLayout';
import { LandingWrapper } from '../components/LandingWrapper';
import { AuthPage } from '../components/AuthPage';
import { OAuthCallback } from '../components/OAuthCallback';
import { AuthCallback } from '../components/AuthCallback';
import { NotFound } from '../components/NotFound';
import { Loader2 } from 'lucide-react';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
);

// Lazy load route components
const Home = lazy(() => import('../components/Home').then(m => ({ default: m.Home })));
const ContentComposer = lazy(() => import('../components/ContentComposer').then(m => ({ default: m.ContentComposer })));
const UnifiedInbox = lazy(() => import('../components/UnifiedInbox').then(m => ({ default: m.UnifiedInbox })));
const ContentCalendar = lazy(() => import('../components/ContentCalendar').then(m => ({ default: m.ContentCalendar })));
const Analytics = lazy(() => import('../components/Analytics').then(m => ({ default: m.Analytics })));
const MediaLibrary = lazy(() => import('../components/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const Notifications = lazy(() => import('../components/Notifications').then(m => ({ default: m.Notifications })));
const Trending = lazy(() => import('../components/Trending').then(m => ({ default: m.Trending })));
const ProjectSettings = lazy(() => import('../components/ProjectSettings').then(m => ({ default: m.ProjectSettings })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingWrapper />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/oauth/callback',
    element: <OAuthCallback />,
  },
  {
    path: '/api/oauth/callback',
    element: <OAuthCallback />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        path: 'dashboard',
        lazy: async () => {
          const { DashboardRoute } = await import('../components/routes/DashboardRoute');
          return { Component: DashboardRoute };
        },
      },
      {
        path: 'compose',
        lazy: async () => {
          const { ComposeRoute } = await import('../components/routes/ComposeRoute');
          return { Component: ComposeRoute };
        },
      },
      {
        path: 'inbox',
        lazy: async () => {
          const { InboxRoute } = await import('../components/routes/InboxRoute');
          return { Component: InboxRoute };
        },
      },
      {
        path: 'calendar',
        lazy: async () => {
          const { CalendarRoute } = await import('../components/routes/CalendarRoute');
          return { Component: CalendarRoute };
        },
      },
      {
        path: 'analytics',
        lazy: async () => {
          const { AnalyticsRoute } = await import('../components/routes/AnalyticsRoute');
          return { Component: AnalyticsRoute };
        },
      },
      {
        path: 'library',
        lazy: async () => {
          const { LibraryRoute } = await import('../components/routes/LibraryRoute');
          return { Component: LibraryRoute };
        },
      },
      {
        path: 'notifications',
        lazy: async () => {
          const { NotificationsRoute } = await import('../components/routes/NotificationsRoute');
          return { Component: NotificationsRoute };
        },
      },
      {
        path: 'trending',
        lazy: async () => {
          const { TrendingRoute } = await import('../components/routes/TrendingRoute');
          return { Component: TrendingRoute };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const { SettingsRoute } = await import('../components/routes/SettingsRoute');
          return { Component: SettingsRoute };
        },
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
