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

  const { data: times = [], isError, isLoading } = useQuery({
    queryKey: ['times'],
    queryFn: fetchTimes,
    refetchInterval: 60_000,
    retry: 3,
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
        {(isError || (!isLoading && times.length === 0)) && (
          <div className="api-banner">
            {isError
              ? '无法连接后端 API — 请先运行 start-backend.bat 或 start.bat'
              : '无预处理数据 — 请运行 POST http://localhost:8000/ingest/demo'}
          </div>
        )}
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
