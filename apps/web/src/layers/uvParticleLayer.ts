import { Color, type Viewer } from 'cesium'
import { assetUrl, fetchAssets } from '../api/client'
import { GpuParticleSystem } from './gpu/gpuParticleSystem'

type UvMeta = {
  width: number
  height: number
  bounds: number[]
  u_min: number
  u_max: number
  v_min: number
  v_max: number
  speed_max: number
}

/** GPU shader particle layer (ComputeCommand + DrawCommand), inspired by Cesium 3D-Wind-Field. */
export class GpuUvParticleLayer {
  private system: GpuParticleSystem | null = null
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
    const uGrid = floats.subarray(0, n)
    const vGrid = floats.subarray(n, n * 2)

    this.system = new GpuParticleSystem({
      particleHeight: layerId === 'wind' ? 10000 : 0,
      speedFactor: layerId === 'wind' ? 1.2 : 0.8,
      dropRate: layerId === 'wind' ? 0.003 : 0.005,
      particleColor: this.color,
      particlesTextureSize: layerId === 'wind' ? 128 : 96,
    })
    this.system.init(viewer, meta, uGrid, vGrid)
  }

  destroy(viewer: Viewer): void {
    if (this.system) {
      this.system.destroy(viewer)
      this.system = null
    }
  }
}
