import './index.css'
import { ThemeProvider } from './components/theme-provider'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Titlebar from './components/Titlebar'

const params = new URLSearchParams(window.location.search)
const isOverlay = params.get('overlay') === '1'

if (isOverlay) {
  document.body.style.background = 'transparent'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {!isOverlay && <Titlebar />}
      <App />
    </ThemeProvider>
  </StrictMode>
)
