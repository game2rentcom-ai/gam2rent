import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// The store's backend address is read at build time. A production build on Vercel without it would go
// live with no login and no prices and nothing to say why, so that build fails with the fix instead.
function requireBackendSettings(): Plugin {
  return {
    name: 'require-backend-settings',
    config(_, { mode }) {
      const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
      if (process.env.VERCEL_ENV === 'production' && !(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)) {
        throw new Error(
          'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Add them in Vercel (Project → Settings → Environment Variables, Production) and redeploy — without them the site has no login and no prices.',
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), requireBackendSettings()],
})
