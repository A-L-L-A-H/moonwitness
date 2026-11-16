import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthGuard, GuestGuard, RootRedirect } from '@/components/router/auth-guard'

// Lazy load components for better performance
const Landing = lazy(() => import('@/app/landing/page'))
const Dashboard = lazy(() => import('@/app/dashboard/page'))
const Mail = lazy(() => import('@/app/mail/page'))
const Tasks = lazy(() => import('@/app/tasks/page'))
const Chat = lazy(() => import('@/app/chat/page'))
const Calendar = lazy(() => import('@/app/calendar/page'))
const Users = lazy(() => import('@/app/users/page'))
const FAQs = lazy(() => import('@/app/faqs/page'))
const Pricing = lazy(() => import('@/app/pricing/page'))
const Projects = lazy(() => import('@/app/projects/page'))
const Organizations = lazy(() => import('@/app/organizations/page'))
const AiChat = lazy(() => import('@/app/ai/chat/page'))
const AiCoding = lazy(() => import('@/app/ai/coding/page'))
const AiBrowser = lazy(() => import('@/app/ai/browser/page'))
const Flows = lazy(() => import('@/app/flows/page'))
const Webhooks = lazy(() => import('@/app/webhooks/page'))

// Auth pages
const SignIn = lazy(() => import('@/app/auth/sign-in/page'))
const SignUp = lazy(() => import('@/app/auth/sign-up/page'))
const ForgotPassword = lazy(() => import('@/app/auth/forgot-password/page'))
const ResetPassword = lazy(() => import('@/app/auth/reset-password/page'))

// Error pages
const Unauthorized = lazy(() => import('@/app/errors/unauthorized/page'))
const Forbidden = lazy(() => import('@/app/errors/forbidden/page'))
const NotFound = lazy(() => import('@/app/errors/not-found/page'))
const InternalServerError = lazy(() => import('@/app/errors/internal-server-error/page'))
const UnderMaintenance = lazy(() => import('@/app/errors/under-maintenance/page'))

// Settings pages
const UserSettings = lazy(() => import('@/app/settings/user/page'))
const AccountSettings = lazy(() => import('@/app/settings/account/page'))
const BillingSettings = lazy(() => import('@/app/settings/billing/page'))
const AppearanceSettings = lazy(() => import('@/app/settings/appearance/page'))
const NotificationSettings = lazy(() => import('@/app/settings/notifications/page'))
const ConnectionSettings = lazy(() => import('@/app/settings/connections/page'))
const ApiKeys = lazy(() => import('@/app/settings/api-keys/page'))

export interface RouteConfig {
  path?: string
  element: React.ReactNode
  children?: RouteConfig[]
}

export const routes: RouteConfig[] = [
  // Default route: dynamically redirects to /dashboard if authenticated, else /auth/sign-in
  {
    path: "/",
    element: <RootRedirect />
  },

  // Public Landing & Marketing Pages
  {
    path: "/landing",
    element: <Landing />
  },
  {
    path: "/faqs",
    element: <FAQs />
  },
  {
    path: "/pricing",
    element: <Pricing />
  },

  // Guest Only Routes (redirects authenticated users to /dashboard)
  {
    element: <GuestGuard />,
    children: [
      {
        path: "/auth/sign-in",
        element: <SignIn />
      },
      {
        path: "/auth/sign-up",
        element: <SignUp />
      },
    ]
  },

  // Authentication Aliases & Recovery
  {
    path: "/login",
    element: <Navigate to="/auth/sign-in" replace />
  },
  {
    path: "/auth/sign-in-2",
    element: <Navigate to="/auth/sign-in" replace />
  },
  {
    path: "/auth/sign-in-3",
    element: <Navigate to="/auth/sign-in" replace />
  },
  {
    path: "/auth/sign-up-2",
    element: <Navigate to="/auth/sign-up" replace />
  },
  {
    path: "/auth/sign-up-3",
    element: <Navigate to="/auth/sign-up" replace />
  },
  {
    path: "/auth/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "/auth/reset-password",
    element: <ResetPassword />
  },
  {
    path: "/auth/forgot-password-2",
    element: <Navigate to="/auth/forgot-password" replace />
  },
  {
    path: "/auth/forgot-password-3",
    element: <Navigate to="/auth/forgot-password" replace />
  },

  // Protected Routes (redirects unauthenticated users to /auth/sign-in)
  {
    element: <AuthGuard />,
    children: [
      // Dashboard Routes
      {
        path: "/dashboard",
        element: <Dashboard />
      },
      {
        path: "/dashboard-2",
        element: <Navigate to="/dashboard" replace />
      },

      // Application Routes
      {
        path: "/projects",
        element: <Projects />
      },
      {
        path: "/projects/:id",
        element: <Projects />
      },
      {
        path: "/organizations",
        element: <Organizations />
      },
      {
        path: "/organizations/:id",
        element: <Organizations />
      },
      {
        path: "/mail",
        element: <Mail />
      },
      {
        path: "/tasks",
        element: <Tasks />
      },
      {
        path: "/chat",
        element: <Chat />
      },
      {
        path: "/calendar",
        element: <Calendar />
      },
      { path: "/flows", element: <Flows /> },
      { path: "/flows/new", element: <Flows /> },
      { path: "/flows/:id", element: <Flows /> },
      { path: "/flows/:id/executions", element: <Flows /> },
      { path: "/flows/:id/executions/:executionId", element: <Flows /> },
      { path: "/webhooks", element: <Webhooks /> },

      // AI Workspace Routes
      {
        path: "/ai/chat",
        element: <AiChat />
      },
      {
        path: "/ai/coding",
        element: <AiCoding />
      },
      {
        path: "/ai/browser",
        element: <AiBrowser />
      },

      // Content Pages
      {
        path: "/users",
        element: <Users />
      },
      {
        path: "/users/:id",
        element: <Users />
      },

      // Settings Routes
      {
        path: "/settings/user",
        element: <UserSettings />
      },
      {
        path: "/settings/account",
        element: <AccountSettings />
      },
      {
        path: "/settings/billing",
        element: <BillingSettings />
      },
      {
        path: "/settings/appearance",
        element: <AppearanceSettings />
      },
      {
        path: "/settings/notifications",
        element: <NotificationSettings />
      },
      {
        path: "/settings/connections",
        element: <ConnectionSettings />
      },
      {
        path: "/settings/api-keys",
        element: <ApiKeys />
      },
    ]
  },

  // Error Pages
  {
    path: "/errors/unauthorized",
    element: <Unauthorized />
  },
  {
    path: "/errors/forbidden",
    element: <Forbidden />
  },
  {
    path: "/errors/not-found",
    element: <NotFound />
  },
  {
    path: "/errors/internal-server-error",
    element: <InternalServerError />
  },
  {
    path: "/errors/under-maintenance",
    element: <UnderMaintenance />
  },

  // Catch-all route for 404
  {
    path: "*",
    element: <NotFound />
  }
]
