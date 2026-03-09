import { useCallback, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from './app/router'
import { ParQuizSplashScreen } from './components/splash/parquiz-splash-screen'
import { useGlobalButtonSound } from './lib/audio'
import { usePlayerProfile, useSyncPlayerProfileCustomization } from './lib/use-player-profile'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const { selectedSkinId } = usePlayerProfile()

  useSyncPlayerProfileCustomization()
  useGlobalButtonSound()

  const handleEnterHome = useCallback(() => {
    const targetPath = selectedSkinId ? '/' : '/skin-selection'

    if (window.location.pathname !== targetPath) {
      void appRouter.navigate(targetPath, { replace: true })
    }

    setShowSplash(false)
  }, [selectedSkinId])

  if (showSplash) {
    return <ParQuizSplashScreen onEnterHome={handleEnterHome} />
  }

  return <RouterProvider router={appRouter} />
}

export default App
