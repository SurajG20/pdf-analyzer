import { cn } from '@/lib/utils'

/**
 * Print registration mark: the crosshair every press shop uses to align
 * plates. It is this app's signature — a sign that the pages line up.
 */
export function RegistrationMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('size-4', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="2.1" />
      <path d="M12 5.5V8M12 16v2.5M5.5 12H8M16 12h2.5" />
      {/* corner ticks */}
      <path d="M8.5 3.5H3.5v5M20.5 8.5v5M15.5 20.5h5v-5M3.5 15.5v5h5" />
    </svg>
  )
}