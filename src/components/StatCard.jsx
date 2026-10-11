import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

const TONES = {
  primary: 'bg-primary/10 text-primary',
  teal: 'bg-teal/15 text-teal',
  navy: 'bg-navy/10 text-navy',
}

export default function StatCard({ label, value, icon: Icon, tone = 'primary' }) {
  return (
    <Card className="py-5">
      <CardContent className="flex items-center gap-4">
        <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
          <Icon className="size-6" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
