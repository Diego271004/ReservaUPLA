import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/montserrat/latin-400.css'
import '@fontsource/montserrat/latin-500.css'
import '@fontsource/montserrat/latin-600.css'
import '@fontsource/montserrat/latin-700.css'
import '@fontsource/poppins/latin-600.css'
import './styles/tokens.css'
import './styles/global.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AvisosProvider } from './context/AvisosContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AvisosProvider>
          <App />
        </AvisosProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
