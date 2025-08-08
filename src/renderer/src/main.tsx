import './index.css'
import { ThemeProvider } from './components/theme-provider'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Titlebar from './components/Titlebar'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Titlebar />
      <App />
    </ThemeProvider>
  </StrictMode>
)
