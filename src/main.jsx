import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { applyBrandTheme } from './brand'
import './index.css'

// Paint the client's palette / title / favicon before the first render.
applyBrandTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
