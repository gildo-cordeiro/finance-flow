import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Alias `@/` -> `src/` (valor relativo à raiz do projeto; evita depender de @types/node).
    // Mantenha em sincronia com `paths` em tsconfig.app.json.
    alias: { '@': '/src' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
