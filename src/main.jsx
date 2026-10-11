import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import ConfirmHost from '@/components/ConfirmHost'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <App />
          <ConfirmHost />
          <Toaster position="top-right" richColors closeButton />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
