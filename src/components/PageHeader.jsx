import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PageHeader({ title, description, back, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {back && (
          <Button variant="outline" size="icon" asChild className="mt-0.5 shrink-0">
            <Link to={back} aria-label="Kembali">
              <ArrowLeft />
            </Link>
          </Button>
        )}
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
