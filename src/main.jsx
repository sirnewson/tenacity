import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { applyBrandTheme } from './brand'
import { applyOverrides } from './brandStore'
import './index.css'

// Paint the client's palette / title / favicon before the first render,
// with anything changed on the Settings page merged over the build defaults.
applyBrandTheme()
applyOverrides()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
