import { ComponentDatatype } from 'cesium'
import { R } from '../../cesium/rendererInternals'

export function getFullscreenQuad(): unknown {
  return new R.Geometry({
    attributes: new R.GeometryAttributes({
      position: new R.GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]),
      }),
      st: new R.GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      }),
    }),
    indices: new Uint32Array([3, 2, 0, 0, 2, 1]),
  })
}

export function createFloatTexture(
  context: unknown,
  width: number,
  height: number,
  data?: Float32Array,
): { destroy: () => void } {
  const options: Record<string, unknown> = {
    context,
    width,
    height,
    pixelFormat: R.PixelFormat.RED,
    pixelDatatype: R.PixelDatatype.FLOAT,
    flipY: false,
    sampler: new R.Sampler({
      minificationFilter: R.TextureMinificationFilter.NEAREST,
      magnificationFilter: R.TextureMagnificationFilter.NEAREST,
    }),
  }
  if (data) {
    options.source = { arrayBufferView: data }
  }
  return new R.Texture(options)
}

export function createRgbaFloatTexture(
  context: unknown,
  width: number,
  height: number,
  data: Float32Array,
): { destroy: () => void } {
  return new R.Texture({
    context,
    width,
    height,
    pixelFormat: R.PixelFormat.RGBA,
    pixelDatatype: R.PixelDatatype.FLOAT,
    flipY: false,
    source: { arrayBufferView: data },
    sampler: new R.Sampler({
      minificationFilter: R.TextureMinificationFilter.NEAREST,
      magnificationFilter: R.TextureMagnificationFilter.NEAREST,
    }),
  })
}

export function createRawRenderState(options: {
  depthTest?: { enabled: boolean; func?: number }
  depthMask?: boolean
  blending?: { enabled: boolean }
}): object {
  return R.Appearance.getDefaultRenderState(true, false, options)
}

export function randomizeParticles(
  count: number,
  west: number,
  south: number,
  east: number,
  north: number,
): Float32Array {
  const arr = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    arr[i * 4] = west + Math.random() * (east - west)
    arr[i * 4 + 1] = south + Math.random() * (north - south)
    arr[i * 4 + 2] = 0
    arr[i * 4 + 3] = 0
  }
  return arr
}

export function createPointsGeometry(textureSize: number): unknown {
  const st: number[] = []
  for (let s = 0; s < textureSize; s++) {
    for (let t = 0; t < textureSize; t++) {
      st.push((s + 0.5) / textureSize, (t + 0.5) / textureSize)
    }
  }
  return new R.Geometry({
    attributes: new R.GeometryAttributes({
      st: new R.GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: new Float32Array(st),
      }),
    }),
  })
}
