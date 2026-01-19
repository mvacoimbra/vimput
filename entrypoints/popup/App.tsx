import { useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { SettingsPanel } from '@/components/SettingsPanel'
import { BuyMeCoffee } from '@/components/BuyMeCoffee'
import { useConfigStore } from '@/stores/configStore'
import { Terminal, Keyboard } from 'lucide-react'

function App() {
  const { theme, loadFromStorage } = useConfigStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [theme])

  return (
    <div className="w-[360px] bg-background text-foreground">
      {/* Header */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Terminal className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Vimput</h1>
              <p className="text-xs text-muted-foreground">Vim-powered input editing</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            v1.0.0
          </Badge>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="px-4 py-3 bg-muted/50 border-b">
        <div className="flex items-start gap-2">
          <Keyboard className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How to use</p>
            <p>Right-click on any text input and select "Edit with Vimput" to open the editor.</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-2">
        <SettingsPanel />
      </div>

      <Separator />

      {/* Footer with Buy Me a Coffee */}
      <div className="p-4 space-y-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">
            Enjoying Vimput? Support the development!
          </p>
          <BuyMeCoffee username="yourusername" />
        </div>

        <div className="text-center text-xs text-muted-foreground pt-2">
          <p>
            Made with{' '}
            <span className="text-red-500">♥</span> for Vim enthusiasts
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
