import { useCallback, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { appRouter } from './app/router'
import { ParquizSplashScreen } from './components/splash/parquiz-splash-screen'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  const handleEnterHome = useCallback(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/')
    }

    setShowSplash(false)
  }, [])

  if (showSplash) {
    return <ParquizSplashScreen onEnterHome={handleEnterHome} />
  }

  return <RouterProvider router={appRouter} />
}

export default App
