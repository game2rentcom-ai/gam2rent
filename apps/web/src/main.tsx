import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// A new version of the site can go live while a tab is open, which makes the old page files disappear. When a
// page's code can't be fetched, load the fresh site (a timestamp stops it from reloading over and over).
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  try {
    if (Date.now() - Number(sessionStorage.getItem('reloaded-for-update') ?? 0) < 60_000) return
    sessionStorage.setItem('reloaded-for-update', String(Date.now()))
  } catch {
    return
  }
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
