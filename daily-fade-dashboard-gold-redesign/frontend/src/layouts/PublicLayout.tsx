import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ToastViewport } from '@/components/ui/Toast'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ToastViewport />
    </div>
  )
}
