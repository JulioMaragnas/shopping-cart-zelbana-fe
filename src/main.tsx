import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'

const queryClient = new QueryClient();

async function enableMocking() {
  if (import.meta.env.MODE !== 'development' || import.meta.env.VITE_USE_MOCKS === 'false') {
    return;
  }
  const { worker } = await import('./mocks/browser');
  // Arranca el Service Worker de MSW para interceptar llamadas en local
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>,
  );
});
