import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { api } from '@/api/client'
import { showError, showSuccess } from '@/utils/alert'
import DashboardView from '@/components/DashboardView'
import { Button } from '@/components/ui/button'

const LINKS = { members: '/members', packages: '/packages' }

// Ringkasan untuk master admin (data dari /api/admin/dashboard?range=)
export default function MasterDashboard() {
  const [range, setRange] = useState('7d')
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ key: null, data: null })

  // Data lama tetap tampil (agak pudar) selama rentang baru dimuat
  const requestKey = `${range}|${reloadKey}`
  const busy = state.key !== requestKey

  useEffect(() => {
    let ignore = false
    api
      .getDashboard(range)
      .then((data) => {
        if (!ignore) setState({ key: requestKey, data })
      })
      .catch((err) => {
        if (!ignore) {
          setState((prev) => ({ ...prev, key: requestKey }))
          showError(err.message)
        }
      })
    return () => {
      ignore = true
    }
    // requestKey sudah terwakili oleh range dan reloadKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, reloadKey])

  const reload = () => setReloadKey((k) => k + 1)

  const activate = async (id) => {
    try {
      await api.activateMember(id)
      showSuccess('Member diaktifkan')
      reload()
    } catch (err) {
      showError(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={reload} disabled={busy}>
          <RefreshCw className={busy ? 'animate-spin' : ''} /> Muat ulang
        </Button>
      </div>
      <DashboardView data={state.data} range={range} onRangeChange={setRange} busy={busy} links={LINKS} onActivate={activate} />
    </div>
  )
}
