import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fetchTimes } from './api/client'
import { EarthGlobe } from './components/EarthGlobe'
import { LayerPanel } from './components/LayerPanel'
import { Timeline } from './components/Timeline'
import { Legend } from './components/Legend'
import { Attribution } from './components/Attribution'
import { useLayerStore } from './stores/layerStore'
import './App.css'

const queryClient = new QueryClient()

function AppInner() {
  const currentTime = useLayerStore((s) => s.currentTime)
  const setCurrentTime = useLayerStore((s) => s.setCurrentTime)

  const { data: times = [] } = useQuery({
    queryKey: ['times'],
    queryFn: fetchTimes,
    refetchInterval: 60_000,
  })

  useEffect(() => {
    if (times.length && !currentTime) {
      setCurrentTime(times[0])
    }
  }, [times, currentTime, setCurrentTime])

  return (
    <div className="app">
      <LayerPanel />
      <main className="globe-wrap">
        <EarthGlobe />
        <Timeline
          times={times}
          value={currentTime}
          onChange={setCurrentTime}
        />
        <Legend />
      </main>
      <Attribution validTime={currentTime} />
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
