import { useEffect, useRef, useState } from 'react'
import { ArrowUp, History, Loader2, Lock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import { renderMarkdown } from '@/lib/markdown'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

function timeAgo(value) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'Baru saja'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function LockedView() {
  return (
    <div className="p-4 md:p-6">
      <Card className="mx-auto mt-10 max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-7" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Agent belum aktif</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Agent hanya tersedia untuk member yang sudah berlangganan paket. Hubungi admin untuk mengaktifkan
            langganan Anda, lalu fitur ini akan terbuka otomatis.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Daftar riwayat: teks saja, menempel ke sidebar utama
function SessionPanel({ sessions, activeId, creating, newDisabled, onSelect, onNew }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          disabled={creating || newDisabled}
          title={newDisabled ? 'Gunakan percakapan kosong yang sudah ada' : undefined}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
        >
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Percakapan baru
        </button>
      </div>

      <p className="px-6 pb-1 text-xs font-medium text-muted-foreground">Riwayat</p>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {sessions.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground">Belum ada percakapan.</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.sessionId}
              type="button"
              onClick={() => onSelect(s.sessionId)}
              title={`${s.messageCount ?? 0} pesan · ${timeAgo(s.updatedAt)}`}
              className={cn(
                'block w-full cursor-pointer truncate rounded-lg px-3 py-2 text-left text-sm transition-colors',
                activeId === s.sessionId ? 'bg-accent font-medium text-primary' : 'hover:bg-muted'
              )}
            >
              {s.title || 'Percakapan baru'}
            </button>
          ))
        )}
      </div>

      {newDisabled && (
        <p className="shrink-0 border-t px-6 py-3 text-xs text-muted-foreground">
          Masih ada percakapan kosong. Kirim pertanyaan di sana sebelum membuat yang baru.
        </p>
      )}
    </div>
  )
}

function Bubble({ message }) {
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] rounded-2xl bg-muted px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap md:max-w-[75%] md:text-[15px]">
          {message.content}
        </div>
        {message.createdAt && <p className="mt-1 px-1 text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</p>}
      </div>
    )
  }
  // Balasan agent: teks polos tanpa gelembung agar nyaman dibaca
  return (
    <div>
      <div
        className="text-sm leading-relaxed break-words md:text-[15px] [&_a]:[overflow-wrap:anywhere] [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
      />
      {message.createdAt && <p className="mt-1.5 text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</p>}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 py-2" aria-label="Agent sedang mengetik">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

export default function AgentPage() {
  const { user } = useAuth()
  const [boot, setBoot] = useState({
    status: user?.subscribed ? 'loading' : 'locked',
    sessions: [],
    error: '',
  })
  const [active, setActive] = useState(null) // { sessionId, title, website, messages, loading }
  const [suggestions, setSuggestions] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const endRef = useRef(null)

  // Percakapan kosong (hanya sapaan pembuka) harus dipakai dulu sebelum membuat yang baru
  const hasEmptySession = boot.sessions.some((s) => (s.messageCount ?? 0) <= 1)

  const setSessions = (updater) => setBoot((prev) => ({ ...prev, sessions: updater(prev.sessions) }))

  const openSession = async (sessionId) => {
    setListOpen(false)
    setSuggestions([])
    setActive({ sessionId, title: '', website: null, messages: [], loading: true })
    try {
      const detail = await api.getAgentSession(sessionId)
      setActive({ ...detail, loading: false })
    } catch (err) {
      toast.error(err.message)
      setActive(null)
    }
  }

  // Muat riwayat sekali; buka percakapan terbaru bila ada
  useEffect(() => {
    if (!user?.subscribed) return undefined
    let ignore = false
    api
      .getAgentSessions()
      .then((sessionData) => {
        if (ignore) return
        setBoot({ status: 'ready', sessions: sessionData.sessions, error: '' })
        if (sessionData.sessions[0]) openSession(sessionData.sessions[0].sessionId)
      })
      .catch((err) => {
        if (ignore) return
        setBoot((prev) => ({ ...prev, status: err.code === 'NOT_SUBSCRIBED' ? 'locked' : 'error', error: err.message }))
      })
    return () => {
      ignore = true
    }
  }, [user?.subscribed])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [active?.messages.length, sending])

  const newConversation = async () => {
    setCreating(true)
    try {
      const detail = await api.createAgentSession()
      setSessions((prev) =>
        prev.some((s) => s.sessionId === detail.sessionId)
          ? prev
          : [{ ...detail, messageCount: detail.messages.length }, ...prev]
      )
      setActive({ ...detail, loading: false })
      setSuggestions([])
      setListOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const send = async (text) => {
    const message = text.trim()
    if (!message || sending || !active || active.loading) return
    const sessionId = active.sessionId

    setInput('')
    setSuggestions([])
    setSending(true)
    setActive((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: message, createdAt: new Date().toISOString() }],
    }))

    try {
      const result = await api.sendAgentMessage(sessionId, message)
      setActive((prev) =>
        prev?.sessionId === sessionId
          ? {
              ...prev,
              title: result.title,
              messages: [...prev.messages, { role: 'assistant', content: result.reply, createdAt: new Date().toISOString() }],
            }
          : prev
      )
      setSuggestions(result.suggestedQuestions || [])
      // Sesi yang baru dipakai pindah ke urutan teratas
      setSessions((prev) => {
        const current = prev.find((s) => s.sessionId === sessionId)
        const rest = prev.filter((s) => s.sessionId !== sessionId)
        return current
          ? [
              {
                ...current,
                title: result.title,
                messageCount: (current.messageCount ?? 0) + 2,
                updatedAt: new Date().toISOString(),
              },
              ...rest,
            ]
          : prev
      })
    } catch (err) {
      if (err.code === 'NOT_SUBSCRIBED') {
        setBoot((prev) => ({ ...prev, status: 'locked' }))
        return
      }
      toast.error(err.message)
      // Pesan gagal terkirim: tarik kembali dari layar dan kembalikan ke kolom input
      setActive((prev) => (prev ? { ...prev, messages: prev.messages.slice(0, -1) } : prev))
      setInput(message)
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  if (boot.status === 'locked') return <LockedView />

  if (boot.status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat Agent...
      </div>
    )
  }

  if (boot.status === 'error') {
    return <p className="py-24 text-center text-sm text-destructive">{boot.error}</p>
  }

  const panel = (
    <SessionPanel
      sessions={boot.sessions}
      activeId={active?.sessionId}
      creating={creating}
      newDisabled={hasEmptySession}
      onSelect={openSession}
      onNew={newConversation}
    />
  )

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
      <aside className="hidden w-64 shrink-0 border-r bg-background lg:block xl:w-72">{panel}</aside>

      <section className="flex min-w-0 flex-1 flex-col bg-card">
        {/* Tombol riwayat untuk layar kecil */}
        <div className="flex h-11 shrink-0 items-center gap-2 border-b px-3 lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setListOpen(true)}>
            <History /> Riwayat
          </Button>
          <p className="min-w-0 flex-1 truncate text-right text-xs text-muted-foreground">{active?.title}</p>
        </div>

        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Ada yang bisa dibantu?</h1>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                Tanyakan seputar RELY Consulting Group, Law Rely, Kakera, dan paket langganan Anda.
              </p>
            </div>
            <Button disabled={creating || hasEmptySession} onClick={newConversation}>
              {creating ? <Loader2 className="animate-spin" /> : <Plus />} Percakapan baru
            </Button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="mx-auto w-full max-w-3xl space-y-7 px-4 py-6 md:px-6 md:py-8">
                {active.loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Memuat percakapan...
                  </div>
                ) : (
                  active.messages.map((m, i) => <Bubble key={`${i}-${m.createdAt}`} message={m} />)
                )}
                {sending && <TypingIndicator />}
                {!sending && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="cursor-pointer rounded-full border px-3 py-1.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent hover:text-primary"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={endRef} />
              </div>
            </div>

            <form
              className="shrink-0 px-4 pt-2 pb-4 md:px-6"
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
            >
              <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl bg-muted py-2 pr-2 pl-4 transition-shadow focus-within:ring-[3px] focus-within:ring-ring/20">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  maxLength={2000}
                  placeholder="Tulis pertanyaan Anda..."
                  className="max-h-40 min-h-9 resize-none border-0 bg-transparent px-0 py-1.5 shadow-none focus-visible:ring-0"
                  disabled={active.loading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="size-9 shrink-0 rounded-full"
                  disabled={sending || active.loading || !input.trim()}
                  aria-label="Kirim"
                >
                  {sending ? <Loader2 className="animate-spin" /> : <ArrowUp />}
                </Button>
              </div>
            </form>
          </>
        )}
      </section>

      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="left" className="w-80 max-w-[85vw] bg-background p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Riwayat percakapan</SheetTitle>
            <SheetDescription>Daftar percakapan Agent Anda</SheetDescription>
          </SheetHeader>
          {panel}
        </SheetContent>
      </Sheet>
    </div>
  )
}
