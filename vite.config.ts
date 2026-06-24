import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 部署在 /dice-and-decay/ 子路徑下；本機開發維持根路徑。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/dice-and-decay/' : '/',
  plugins: [react()],
  server: { host: true },
}))
