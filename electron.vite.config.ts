import { resolve } from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  main: {
    resolve: {
      alias: [
        { find: /^@\/types/, replacement: resolve(__dirname, "src/types") },
        { find: "@", replacement: resolve(__dirname, "src/renderer/src") }
      ]
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: [
        { find: /^@\/types/, replacement: resolve("src/types") },
        { find: "@", replacement: resolve("src/renderer/src") }
      ]
    },
    plugins: [react(), tailwindcss()]
  }
})
