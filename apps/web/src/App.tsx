import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fetchTimes, triggerDemoIngest } from './api/client'
import { EarthGlobe } from './components/EarthGlobe'
import { LayerPanel } from './components/LayerPanel'
import { FlyToPanel } from './components/FlyToPanel'
import { Timeline } from './components/Timeline'
import { Legend } from './components/Legend'
import { Attribution } from './components/Attribution'
import { CrosshairOverlay } from './components/CrosshairOverlay'
import { useLayerStore } from './stores/layerStore'
import { pickNearestValidTime } from './utils/timeSelection'
import './App.css'

const queryClient = new QueryClient()

function AppInner() {
  const currentTime = useLayerStore((s) => s.currentTime)
  const setCurrentTime = useLayerStore((s) => s.setCurrentTime)
  const qc = useQueryClient()
  const demoTriggered = useRef(false)

  const { data: times = [], isError, isLoading } = useQuery({
    queryKey: ['times'],
    queryFn: fetchTimes,
    refetchInterval: 60_000,
    retry: 3,
  })

  useEffect(() => {
    if (isLoading || isError || times.length > 0 || demoTriggered.current) return
    demoTriggered.current = true
    void triggerDemoIngest()
      .then(() => qc.invalidateQueries({ queryKey: ['times'] }))
      .catch(() => {
        demoTriggered.current = false
      })
  }, [isLoading, isError, times.length, qc])

  useEffect(() => {
    if (!times.length) return
    const nearest = pickNearestValidTime(times)
    if (!nearest) return
    if (!currentTime) {
      setCurrentTime(nearest)
      return
    }
    if (!times.includes(currentTime)) {
      setCurrentTime(nearest)
    }
  }, [times, currentTime, setCurrentTime])

  return (
    <div className="app">
      <div className="sidebar">
        <LayerPanel />
        <FlyToPanel />
      </div>
      <main className="globe-wrap">
        {(isError || (!isLoading && times.length === 0)) && (
          <div className="api-banner">
            {isError
              ? '无法连接后端 API — 请先运行 start-backend.bat 或 start.bat'
              : '正在生成演示数据…'}
          </div>
        )}
        <EarthGlobe />
        <CrosshairOverlay />
        <Timeline
          times={times}
          value={currentTime}
          onChange={setCurrentTime}
        />
        <Legend />
        <Attribution validTime={currentTime} compact />
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
