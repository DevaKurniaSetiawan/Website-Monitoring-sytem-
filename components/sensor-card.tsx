import type { LucideIcon } from "lucide-react"

interface SensorCardProps {
  title: string
  value: number
  unit: string
  icon: LucideIcon
  color: string
  status?: "normal" | "warning" | "danger"
}

export function SensorCard({ title, value, unit, icon: Icon, color, status = "normal" }: SensorCardProps) {
  const statusColors = {
    normal: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    warning: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    danger: "from-red-500/10 to-red-500/5 border-red-500/20",
  }

  const iconColors = {
    normal: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${statusColors[status]} p-6 shadow-sm transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">{value.toFixed(2)}</span>
            <span className="text-lg font-medium text-muted-foreground">{unit}</span>
          </div>
        </div>
        <div className={`rounded-lg bg-background/50 p-3 ${iconColors[status]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className={`absolute bottom-0 right-0 w-32 h-32 ${color} opacity-5 rounded-full -mr-16 -mb-16`} />
    </div>
  )
}
