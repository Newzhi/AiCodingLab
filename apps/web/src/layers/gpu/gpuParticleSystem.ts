import { Color, type Viewer } from 'cesium'
import { R } from '../../cesium/rendererInternals'
import { CustomPrimitive } from './customPrimitive'
import {
  createFloatTexture,
  createPointsGeometry,
  createRgbaFloatTexture,
  createRawRenderState,
  randomizeParticles,
} from './gpuUtils'
import {
  CALCULATE_SPEED_FRAG,
  POINT_DRAW_FRAG,
  POINT_DRAW_VERT,
  POST_PROCESS_POSITION_FRAG,
  UPDATE_POSITION_FRAG,
} from './shaders'

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

type GpuParticleOptions = {
  particleHeight: number
  speedFactor: number
  dropRate: number
  dropRateBump: number
  particlesTextureSize: number
  particleColor: Color
}

const DEFAULT_OPTIONS: GpuParticleOptions = {
  particleHeight: 10000,
  speedFactor: 1.0,
  dropRate: 0.003,
  dropRateBump: 0.01,
  particlesTextureSize: 128,
  particleColor: Color.CYAN.withAlpha(0.85),
}

export class GpuParticleSystem {
  private primitives: CustomPrimitive[] = []
  private windTextures: { U: ReturnType<typeof createFloatTexture>; V: ReturnType<typeof createFloatTexture> } | null =
    null
  private particlesTextures: Record<string, ReturnType<typeof createRgbaFloatTexture>> | null = null
  private computingPrimitives: Record<string, CustomPrimitive> | null = null
  private drawPrimitive: CustomPrimitive | null = null
  private options: GpuParticleOptions

  constructor(options: Partial<GpuParticleOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  init(viewer: Viewer, meta: UvMeta, uGrid: Float32Array, vGrid: Float32Array): void {
    this.destroy(viewer)
    const scene = viewer.scene as unknown as { context: { floatingPointTexture?: boolean } }
    const context = scene.context
    if (!context.floatingPointTexture) {
      console.warn(
        'GPU particle layer requires WebGL float textures (OES_texture_float). Particles may not render.',
      )
    }
    const [west, south, east, north] = meta.bounds
    const { width, height } = meta
    const textureSize = this.options.particlesTextureSize
    const maxParticles = textureSize * textureSize

    this.windTextures = {
      U: createFloatTexture(context, width, height, uGrid),
      V: createFloatTexture(context, width, height, vGrid),
    }

    const particlesArray = randomizeParticles(maxParticles, west, south, east, north)
    const zeroArray = new Float32Array(maxParticles * 4).fill(0)

    this.particlesTextures = {
      previousParticlesPosition: createRgbaFloatTexture(context, textureSize, textureSize, particlesArray),
      currentParticlesPosition: createRgbaFloatTexture(context, textureSize, textureSize, particlesArray),
      nextParticlesPosition: createRgbaFloatTexture(context, textureSize, textureSize, particlesArray),
      postProcessingPosition: createRgbaFloatTexture(context, textureSize, textureSize, particlesArray),
      particlesSpeed: createRgbaFloatTexture(context, textureSize, textureSize, zeroArray),
    }

    const dimension = new R.Cartesian3(width, height, 1)
    const minimum = new R.Cartesian3(west, south, 0)
    const interval = new R.Cartesian3(
      width > 1 ? (east - west) / (width - 1) : 1,
      height > 1 ? (north - south) / (height - 1) : 1,
      1,
    )
    const uSpeedRange = new R.Cartesian2(meta.u_min, meta.u_max)
    const vSpeedRange = new R.Cartesian2(meta.v_min, meta.v_max)
    const lonRange = new R.Cartesian2(west, east)
    const latRange = new R.Cartesian2(south, north)
    const pixelSize = 1.0
    const that = this

    this.computingPrimitives = {
      calculateSpeed: new CustomPrimitive({
        commandType: 'Compute',
        uniformMap: {
          U: () => that.windTextures!.U,
          V: () => that.windTextures!.V,
          currentParticlesPosition: () => that.particlesTextures!.currentParticlesPosition,
          dimension: () => dimension,
          minimum: () => minimum,
          interval: () => interval,
          uSpeedRange: () => uSpeedRange,
          vSpeedRange: () => vSpeedRange,
          pixelSize: () => pixelSize,
          speedFactor: () => that.options.speedFactor,
        },
        fragmentShaderSource: new R.ShaderSource({ sources: [CALCULATE_SPEED_FRAG] }),
        outputTexture: this.particlesTextures.particlesSpeed,
        preExecute: () => {
          const temp = that.particlesTextures!.previousParticlesPosition
          that.particlesTextures!.previousParticlesPosition = that.particlesTextures!.currentParticlesPosition
          that.particlesTextures!.currentParticlesPosition = that.particlesTextures!.postProcessingPosition
          that.particlesTextures!.postProcessingPosition = temp
          ;(that.computingPrimitives!.calculateSpeed.commandToExecute as { outputTexture: unknown }).outputTexture =
            that.particlesTextures!.particlesSpeed
        },
      }),
      updatePosition: new CustomPrimitive({
        commandType: 'Compute',
        uniformMap: {
          currentParticlesPosition: () => that.particlesTextures!.currentParticlesPosition,
          particlesSpeed: () => that.particlesTextures!.particlesSpeed,
        },
        fragmentShaderSource: new R.ShaderSource({ sources: [UPDATE_POSITION_FRAG] }),
        outputTexture: this.particlesTextures.nextParticlesPosition,
        preExecute: () => {
          ;(that.computingPrimitives!.updatePosition.commandToExecute as { outputTexture: unknown }).outputTexture =
            that.particlesTextures!.nextParticlesPosition
        },
      }),
      postProcessingPosition: new CustomPrimitive({
        commandType: 'Compute',
        uniformMap: {
          nextParticlesPosition: () => that.particlesTextures!.nextParticlesPosition,
          particlesSpeed: () => that.particlesTextures!.particlesSpeed,
          lonRange: () => lonRange,
          latRange: () => latRange,
          randomCoefficient: () => Math.random(),
          dropRate: () => that.options.dropRate,
          dropRateBump: () => that.options.dropRateBump,
        },
        fragmentShaderSource: new R.ShaderSource({ sources: [POST_PROCESS_POSITION_FRAG] }),
        outputTexture: this.particlesTextures.postProcessingPosition,
        preExecute: () => {
          ;(that.computingPrimitives!.postProcessingPosition.commandToExecute as { outputTexture: unknown }).outputTexture =
            that.particlesTextures!.postProcessingPosition
        },
      }),
    }

    const color = this.options.particleColor
    this.drawPrimitive = new CustomPrimitive({
      commandType: 'Draw',
      attributeLocations: { st: 0 },
      geometry: createPointsGeometry(textureSize),
      primitiveType: R.PrimitiveType.POINTS,
      uniformMap: {
        currentParticlesPosition: () => that.particlesTextures!.currentParticlesPosition,
        particleHeight: () => that.options.particleHeight,
        particleColor: () => new R.Cartesian4(color.red, color.green, color.blue, color.alpha),
      },
      vertexShaderSource: new R.ShaderSource({ sources: [POINT_DRAW_VERT] }),
      fragmentShaderSource: new R.ShaderSource({ sources: [POINT_DRAW_FRAG] }),
      rawRenderState: createRawRenderState({
        depthTest: { enabled: true },
        depthMask: true,
        blending: { enabled: true },
      }),
    })

    this.primitives = [
      this.computingPrimitives.calculateSpeed,
      this.computingPrimitives.updatePosition,
      this.computingPrimitives.postProcessingPosition,
      this.drawPrimitive,
    ]

    for (const p of this.primitives) {
      viewer.scene.primitives.add(p as never)
    }
  }

  destroy(viewer: Viewer): void {
    for (const p of this.primitives) {
      viewer.scene.primitives.remove(p as never)
      p.destroy()
    }
    this.primitives = []
    if (this.windTextures) {
      this.windTextures.U.destroy()
      this.windTextures.V.destroy()
      this.windTextures = null
    }
    if (this.particlesTextures) {
      Object.values(this.particlesTextures).forEach((t) => t.destroy())
      this.particlesTextures = null
    }
    this.computingPrimitives = null
    this.drawPrimitive = null
  }
}
