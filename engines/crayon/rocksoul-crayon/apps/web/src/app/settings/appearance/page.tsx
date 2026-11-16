import { useTheme } from '@/hooks/use-theme'
import { BaseLayout } from '@/components/layouts/base-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  return <BaseLayout title="Appearance" description="Theme preference is persisted locally by the application shell."><div className="px-4 lg:px-6"><Card className="max-w-2xl"><CardHeader><CardTitle>Theme</CardTitle><CardDescription>Choose light, dark, or system appearance.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2">{(['light', 'dark', 'system'] as const).map(option => <Button key={option} className="min-h-10" variant={theme === option ? 'default' : 'outline'} aria-pressed={theme === option} onClick={() => setTheme(option)}>{option[0].toUpperCase() + option.slice(1)}</Button>)}</CardContent></Card></div></BaseLayout>
}
