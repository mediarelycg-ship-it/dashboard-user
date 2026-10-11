import { useEffect, useRef } from 'react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Tombol resmi Google Identity Services. Mengembalikan ID token ke onCredential.
export default function GoogleSignInButton({ onCredential, text = 'continue_with' }) {
  const containerRef = useRef(null)
  const callbackRef = useRef(onCredential)

  useEffect(() => {
    callbackRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined

    let cancelled = false
    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => callbackRef.current(response.credential),
      })
      containerRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        width: containerRef.current.offsetWidth || 360,
      })
    }

    if (window.google?.accounts?.id) {
      render()
      return () => {
        cancelled = true
      }
    }

    let script = document.querySelector(`script[src="${GSI_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = GSI_SRC
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', render)
    return () => {
      cancelled = true
      script.removeEventListener('load', render)
    }
  }, [text])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Login Google belum dikonfigurasi (VITE_GOOGLE_CLIENT_ID).
      </p>
    )
  }

  return <div ref={containerRef} className="flex min-h-10 justify-center" />
}
