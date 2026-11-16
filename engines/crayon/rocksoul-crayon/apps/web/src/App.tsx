import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarConfigProvider } from '@/contexts/sidebar-context'
import { AppRouter } from '@/components/router/app-router'
import { useEffect } from 'react'
import { initGTM } from '@/utils/analytics'
import { MetadataRuntimeProvider } from '@/metadata-runtime'
import { Toaster, toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { ApplicationActionsProvider, MoonWitnessAssetProvider, NavigationProvider } from '@rocksoul/ui'
import { api } from '@/lib/api-client'

// Get basename from environment (for deployment) or use empty string for development
const basename = import.meta.env.VITE_BASENAME || ''

function App() {
  // Initialize GTM on app load
  useEffect(() => {
    initGTM();
  }, []);

  return (
    <div className="font-sans antialiased" style={{ fontFamily: 'var(--font-inter)' }}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <MetadataRuntimeProvider>
          <SidebarConfigProvider>
            <Router basename={basename}>
              <UiRuntimeProviders>
                <SessionRecovery />
                <AppRouter />
                <Toaster richColors closeButton />
              </UiRuntimeProviders>
            </Router>
          </SidebarConfigProvider>
        </MetadataRuntimeProvider>
      </ThemeProvider>
    </div>
  )
}

export default App

function UiRuntimeProviders({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return <NavigationProvider adapter={{ navigate }}><MoonWitnessAssetProvider><ApplicationActionsProvider actions={{
    onSignOut: async () => { try { await api.request('/api/v1/auth/logout', { method: 'POST' }) } finally { api.setToken(null); navigate('/auth/sign-in') } },
    onMarkAllNotificationsRead: async () => { await api.notifications.markAllRead() },
  }}>{children}</ApplicationActionsProvider></MoonWitnessAssetProvider></NavigationProvider>
}

function SessionRecovery() {
  const navigate = useNavigate()
  useEffect(() => {
    const onExpired = () => { toast.error('Your session has expired. Sign in to continue.'); navigate('/auth/sign-in', { replace: true }) }
    window.addEventListener('rocksoul:session-expired', onExpired)
    return () => window.removeEventListener('rocksoul:session-expired', onExpired)
  }, [navigate])
  return null
}
