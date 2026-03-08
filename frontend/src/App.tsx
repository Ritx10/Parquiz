import { useCallback, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from './app/router'
import { ParQuizSplashScreen } from './components/splash/parquiz-splash-screen'
import { useGlobalButtonSound } from './lib/audio'
import { useSyncPlayerProfileCustomization } from './lib/use-player-profile'
import { useAppSettingsStore } from './store/app-settings-store'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  useSyncPlayerProfileCustomization()
  useGlobalButtonSound()

  const handleEnterHome = useCallback(() => {
    const hasSelectedSkin = Boolean(useAppSettingsStore.getState().selectedSkinId)
    const targetPath = hasSelectedSkin ? '/' : '/skin-selection'

    if (window.location.pathname !== targetPath) {
      void appRouter.navigate(targetPath, { replace: true })
    }

    setShowSplash(false)
  }, [])

  if (showSplash) {
    return <ParQuizSplashScreen onEnterHome={handleEnterHome} />
  }

  return <RouterProvider router={appRouter} />
}

export default App
