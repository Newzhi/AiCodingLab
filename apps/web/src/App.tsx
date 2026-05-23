import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EarthGlobe } from './components/EarthGlobe'
import { LayerPanel } from './components/LayerPanel'
import { FlyToPanel } from './components/FlyToPanel'
import { Attribution } from './components/Attribution'
import { CrosshairOverlay } from './components/CrosshairOverlay'
import './App.css'

const queryClient = new QueryClient()

function AppInner() {
  return (
    <div className="app">
      <div className="sidebar">
        <LayerPanel />
        <FlyToPanel />
      </div>
      <main className="globe-wrap">
        <EarthGlobe />
        <CrosshairOverlay />
        <Attribution compact />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}
