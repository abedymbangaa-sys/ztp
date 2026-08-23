import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { captureUTMOnce } from './lib/utm.js'
import './index.css'

// Must run before anything else - captures utm_source/medium/campaign
// from the landing URL (if any) into sessionStorage so every lead event
// this session can be attributed to its real source, not just the page
// the visitor happened to be on when they clicked WhatsApp/Call/etc.
captureUTMOnce();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
