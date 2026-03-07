import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSettingsStore } from '../store/app-settings-store'

export function AppShell() {
  const location = useLocation()
  const selectedSkinId = useAppSettingsStore((state) => state.selectedSkinId)

  if (!selectedSkinId && location.pathname !== '/skin-selection') {
    return <Navigate replace to="/skin-selection" />
  }

  if (selectedSkinId && location.pathname === '/skin-selection') {
    return <Navigate replace to="/" />
  }

  return (
    <div className="min-h-screen w-full">
      <main>
        <Outlet />
      </main>
    </div>
  )
}
