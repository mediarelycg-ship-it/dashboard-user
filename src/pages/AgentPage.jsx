import { useEffect, useRef, useState } from 'react'
import { Bot, History, Loader2, Lock, MessageSquarePlus, Send } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/auth-context'
import { renderMarkdown } from '@/lib/markdown'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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

function LockedView() {
  return (
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
  )
}

function SessionPanel({ sessions, activeId, creating, newDisabled, onSelect, onNew }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <p className="text-sm font-semibold">Riwayat</p>
        <Button
          size="sm"
          onClick={onNew}
          disabled={creating || newDisabled}
          title={newDisabled ? 'Gunakan percakapan kosong yang sudah ada' : undefined}
        >
          {creating ? <Loader2 className="animate-spin" /> : <MessageSquarePlus />} Baru
        </Button>
      </div>
      {newDisabled && (
        <p className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          Masih ada percakapan kosong. Kirim pertanyaan di sana sebelum membuat yang baru.
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada percakapan.</p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.sessionId}
              type="button"
              onClick={() => onSelect(s.sessionId)}
              className={cn(
                'w-full cursor-pointer border-b border-l-[3px] px-4 py-3 text-left transition-colors hover:bg-accent',
                activeId === s.sessionId ? 'border-l-primary bg-primary/5' : 'border-l-transparent'
              )}
            >
              <p className="truncate text-sm font-medium">{s.title || 'Percakapan baru'}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {s.messageCount ?? 0} pesan · {timeAgo(s.updatedAt)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function Bubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-4" />
        </span>
      )}
      <div className="max-w-[85%] md:max-w-[75%]">
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border bg-card shadow-xs'
          )}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
        {message.createdAt && (
          <p className={cn('mt-1 px-1 text-[10px] text-muted-foreground', isUser && 'text-right')}>
            {new Date(message.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="size-4" />
      </span>
      <div className="flex gap-1 rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-xs" aria-label="Agent sedang mengetik">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent</h1>
        <p className="text-sm text-muted-foreground">Tanya seputar layanan RELY Group dan paket Anda. Percakapan tersimpan di riwayat.</p>
      </div>

      <div className="flex h-[calc(100svh-12rem)] min-h-[460px] overflow-hidden rounded-xl border bg-card shadow-xs">
        <aside className="hidden w-72 shrink-0 border-r md:block">{panel}</aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="size-7" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Mulai percakapan</h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Tanyakan apa saja seputar RELY Consulting Group, Law Rely, Kakera, dan paket langganan Anda.
                </p>
              </div>
              <Button disabled={creating || hasEmptySession} onClick={newConversation}>
                {creating ? <Loader2 className="animate-spin" /> : <MessageSquarePlus />} Mulai percakapan baru
              </Button>
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setListOpen(true)}>
                <History /> Lihat riwayat
              </Button>
            </div>
          ) : (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setListOpen(true)} aria-label="Riwayat">
                  <History />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{active.title || 'Percakapan baru'}</p>
                  <p className="truncate text-xs text-muted-foreground">Semua layanan RELY Group</p>
                </div>
                <Badge variant="info">Member</Badge>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/30 px-4 py-4 md:px-6">
                {active.loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Memuat percakapan...
                  </div>
                ) : (
                  active.messages.map((m, i) => <Bubble key={`${i}-${m.createdAt}`} message={m} />)
                )}
                {sending && <TypingIndicator />}
                {!sending && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-10">
                    {suggestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="cursor-pointer rounded-full border bg-card px-3 py-1.5 text-left text-xs text-primary transition-colors hover:bg-accent"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <form
                className="flex shrink-0 items-end gap-2 border-t p-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  send(input)
                }}
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  maxLength={2000}
                  placeholder="Tulis pertanyaan Anda... (Enter untuk kirim, Shift+Enter baris baru)"
                  className="max-h-32 min-h-10 resize-none"
                  disabled={active.loading}
                />
                <Button type="submit" size="icon" disabled={sending || active.loading || !input.trim()} aria-label="Kirim">
                  {sending ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>

      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="left" className="w-80 p-0">
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
