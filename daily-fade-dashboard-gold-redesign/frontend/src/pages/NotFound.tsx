import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl text-ink">404</p>
      <p className="mt-3 text-ink-soft">This chair is empty. The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-8">
        <Button>Back to Home</Button>
      </Link>
    </div>
  )
}
