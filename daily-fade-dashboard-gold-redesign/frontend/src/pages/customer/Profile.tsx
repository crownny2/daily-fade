import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export function Profile() {
  const { user } = useAuth()
  const { showToast } = useToast()

  if (!user) return null

  // Editing/password-change endpoints don't exist on the customer API yet
  // (Phase 7E-1A is frontend-only), so these surface the affordance without
  // pretending to persist anything.
  const comingSoon = () => showToast('Editing your profile is coming soon.', 'info')

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">Your account</p>
      <h1 className="mt-2 font-display text-4xl text-ink">Profile</h1>

      <Card className="mt-10 overflow-hidden">
        <div className="bg-noir-fade px-6 py-8 text-bone">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/50 bg-noir-raised font-display text-3xl text-gold-bright">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-display text-2xl">{user.name}</p>
              <Badge tone="accent">{user.role}</Badge>
            </div>
          </div>
        </div>

        <div className="p-6">
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-line pb-3">
              <dt className="text-ink-soft">Full Name</dt>
              <dd className="font-medium text-ink">{user.name}</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-3">
              <dt className="text-ink-soft">Email</dt>
              <dd className="font-medium text-ink">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Phone</dt>
              <dd className="font-medium text-ink">{user.phone ?? 'Not provided'}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={comingSoon}>
              Edit Profile
            </Button>
            <Button variant="ghost" className="flex-1" onClick={comingSoon}>
              Change Password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
