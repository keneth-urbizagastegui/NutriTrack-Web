import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { AxiosInterceptor } from './components/layout/AxiosInterceptor'
import { ErrorBoundary } from './components/common/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AxiosInterceptor>
        <App />
      </AxiosInterceptor>
    </ErrorBoundary>
  </StrictMode>,
)
