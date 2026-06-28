import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminApp from './admin/App.jsx'

const isHtmlAdmin = window.location.pathname === '/admin' || window.location.pathname === '/admin/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isHtmlAdmin ? <AdminApp /> : <App />}
  </StrictMode>,
)

