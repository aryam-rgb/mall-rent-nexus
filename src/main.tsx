import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/useAuth'
import { CurrencyProvider } from '@/hooks/useCurrency'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <CurrencyProvider>
        <App />
        <Toaster />
      </CurrencyProvider>
    </AuthProvider>
  </BrowserRouter>
);
