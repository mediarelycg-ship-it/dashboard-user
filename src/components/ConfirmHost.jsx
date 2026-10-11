import { useEffect, useRef, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { registerConfirmHandler } from '@/utils/alert'

export default function ConfirmHost() {
  const [state, setState] = useState({ open: false, message: '', confirmText: '' })
  const resolver = useRef(null)

  useEffect(() => {
    return registerConfirmHandler(
      ({ message, confirmText }) =>
        new Promise((resolve) => {
          resolver.current = resolve
          setState({ open: true, message, confirmText })
        }),
    )
  }, [])

  const settle = (value) => {
    resolver.current?.(value)
    resolver.current = null
    setState((s) => ({ ...s, open: false }))
  }

  return (
    <AlertDialog open={state.open} onOpenChange={(open) => !open && settle(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-warning/15 text-warning">
            <TriangleAlert className="size-5" />
          </div>
          <AlertDialogTitle>Konfirmasi</AlertDialogTitle>
          <AlertDialogDescription>{state.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={() => settle(true)}>{state.confirmText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
