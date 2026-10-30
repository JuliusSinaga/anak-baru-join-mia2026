export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="7" fill="#0b2545" />
      <path d="M9 23c3-4 4-9 7-9s4 5 7 9" fill="none" stroke="#5aa9ff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="9" r="2.6" fill="#ffffff" />
    </svg>
  )
}
