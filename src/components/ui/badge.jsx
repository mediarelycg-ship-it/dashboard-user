import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        success: 'border-transparent bg-success/10 text-success',
        warning: 'border-transparent bg-warning/10 text-warning',
        info: 'border-transparent bg-primary/10 text-primary',
        muted: 'border-transparent bg-muted text-muted-foreground',
        danger: 'border-transparent bg-destructive/10 text-destructive',
        outline: 'text-foreground',
        destructive: 'border-transparent bg-destructive text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
