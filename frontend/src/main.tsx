import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProviders } from './app/providers.tsx'

const rootContent = (
  <AppProviders>
    <App />
  </AppProviders>
)

createRoot(document.getElementById('root')!).render(import.meta.env.DEV ? rootContent : <StrictMode>{rootContent}</StrictMode>)
