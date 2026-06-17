import { ShieldCheck } from "lucide-react"

export function PrivacyNotice({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border border-border bg-secondary/60 px-3.5 py-3 ${className ?? ""}`}
    >
      <ShieldCheck
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}
