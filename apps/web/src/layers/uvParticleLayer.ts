import {
  Viewer,
  Color,
  Cartesian3,
  PointPrimitiveCollection,
  JulianDate,
} from 'cesium'
import { assetUrl, fetchAssets } from '../api/client'

type UvMeta = {
  width: number
  height: number
  bounds: number[]
  speed_max: number
}

type ParticleState = {
  lon: number
  lat: number
  age: number
}

export class UvParticleLayer {
  private collection: PointPrimitiveCollection | null = null
  private particles: ParticleState[] = []
  private uGrid: Float32Array | null = null
  private vGrid: Float32Array | null = null
  private meta: UvMeta | null = null
  private removeListener: (() => void) | null = null
  private color: Color

  constructor(color: Color = Color.CYAN.withAlpha(0.85)) {
    this.color = color
  }

  async load(viewer: Viewer, validTime: string, layerId: 'wind' | 'ocean'): Promise<void> {
    this.destroy(viewer)
    const assets = await fetchAssets(validTime, layerId)
    const metaUrl = assetUrl(assets.files.meta)
    const binUrl = assetUrl(assets.files.binary)

    const meta: UvMeta = await (await fetch(metaUrl)).json()
    const buf = await (await fetch(binUrl)).arrayBuffer()
    const floats = new Float32Array(buf)
    const n = floats.length / 2
    this.uGrid = floats.subarray(0, n)
    this.vGrid = floats.subarray(n, n * 2)
    this.meta = meta

    const count = layerId === 'wind' ? 12000 : 8000
    this.particles = Array.from({ length: count }, () => ({
      lon: Math.random() * 360 - 180,
      lat: Math.random() * 160 - 80,
      age: Math.random(),
    }))

    this.collection = viewer.scene.primitives.add(new PointPrimitiveCollection())
    for (const p of this.particles) {
      this.collection.add({
        position: Cartesian3.fromDegrees(p.lon, p.lat, layerId === 'wind' ? 10000 : 0),
        color: this.color,
        pixelSize: 2,
      })
    }

    const height = layerId === 'wind' ? 10000 : 0
    this.removeListener = viewer.scene.preRender.addEventListener(() => {
      if (!this.collection || !this.meta || !this.uGrid || !this.vGrid) return
      const dt = 0.016
      const { width, height: h, bounds, speed_max } = this.meta
      const [west, south, east, north] = bounds
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i]
        p.age += dt
        const ix = Math.floor(((p.lon - west) / (east - west)) * (width - 1))
        const iy = Math.floor(((p.lat - south) / (north - south)) * (h - 1))
        const idx = Math.max(0, Math.min(width * h - 1, iy * width + ix))
        const u = this.uGrid[idx]
        const v = this.vGrid[idx]
        const speed = Math.hypot(u, v) || 1e-6
        const step = (speed / Math.max(speed_max, 1e-6)) * 0.25
        p.lon += (u / speed) * step
        p.lat += (v / speed) * step
        if (p.age > 3 || p.lon < west || p.lon > east || p.lat < south || p.lat > north) {
          p.lon = west + Math.random() * (east - west)
          p.lat = south + Math.random() * (north - south)
          p.age = 0
        }
        const prim = this.collection.get(i)
        prim.position = Cartesian3.fromDegrees(p.lon, p.lat, height)
      }
      void JulianDate.now()
    })
  }

  destroy(viewer: Viewer): void {
    if (this.removeListener) {
      this.removeListener()
      this.removeListener = null
    }
    if (this.collection) {
      viewer.scene.primitives.remove(this.collection)
      this.collection = null
    }
    this.particles = []
    this.uGrid = null
    this.vGrid = null
    this.meta = null
  }
}
