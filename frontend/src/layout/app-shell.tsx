import { Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="min-h-screen w-full">
      <main>
        <Outlet />
      </main>
    </div>
  )
}
