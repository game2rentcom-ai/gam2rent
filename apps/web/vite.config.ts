import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// A value pasted into Vercel can carry an invisible byte-order mark or a stray newline, and Vite inlines it as is.
// Cleaned here in Node: a trim() in app code can't do it, the minifier folds it away with Rust rules that keep the mark.
const clean = (value: string | undefined) => value?.replace(/^﻿+/, '').trim() || undefined

// The store's backend address is read at build time. A production build on Vercel without it would go
// live with no login and no prices and nothing to say why, so that build fails with the fix instead.
function requireBackendSettings(): Plugin {
  return {
    name: 'require-backend-settings',
    config(_, { mode }) {
      const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
      const url = clean(env.VITE_SUPABASE_URL)
      const key = clean(env.VITE_SUPABASE_ANON_KEY)
      if (process.env.VERCEL_ENV === 'production' && !(url && key)) {
        throw new Error(
          'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Add them in Vercel (Project → Settings → Environment Variables, Production) and redeploy — without them the site has no login and no prices.',
        )
      }
      // Anything else would turn every data request into a request for this site's own page.
      if (url && !/^https?:\/\/\S+$/.test(url)) {
        throw new Error(`VITE_SUPABASE_URL must be a web address like https://xxxx.supabase.co, but it is ${JSON.stringify(url)}. Fix it in Vercel and redeploy.`)
      }
      return {
        define: {
          ...(url && { 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url) }),
          ...(key && { 'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(key) }),
        },
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), requireBackendSettings()],
})
