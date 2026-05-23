import { R } from '../../cesium/rendererInternals'

export type CustomPrimitiveOptions = {
  commandType: 'Draw' | 'Compute'
  geometry?: unknown
  attributeLocations?: Record<string, number>
  primitiveType?: number
  uniformMap: Record<string, () => unknown>
  vertexShaderSource?: { sources: string[]; defines?: string[] }
  fragmentShaderSource: { sources: string[]; defines?: string[] }
  rawRenderState?: object
  framebuffer?: unknown
  outputTexture?: unknown
  autoClear?: boolean
  preExecute?: () => void
}

export class CustomPrimitive {
  commandType: 'Draw' | 'Compute'
  geometry?: unknown
  attributeLocations?: Record<string, number>
  primitiveType?: number
  uniformMap: Record<string, () => unknown>
  vertexShaderSource?: { sources: string[]; defines?: string[] }
  fragmentShaderSource: { sources: string[]; defines?: string[] }
  rawRenderState?: object
  framebuffer?: unknown
  outputTexture?: unknown
  autoClear: boolean
  preExecute?: () => void
  show = true
  commandToExecute?: unknown
  clearCommand?: unknown

  constructor(options: CustomPrimitiveOptions) {
    this.commandType = options.commandType
    this.geometry = options.geometry
    this.attributeLocations = options.attributeLocations
    this.primitiveType = options.primitiveType
    this.uniformMap = options.uniformMap
    this.vertexShaderSource = options.vertexShaderSource
    this.fragmentShaderSource = options.fragmentShaderSource
    this.rawRenderState = options.rawRenderState
    this.framebuffer = options.framebuffer
    this.outputTexture = options.outputTexture
    this.autoClear = R.defaultValue(options.autoClear, false)
    this.preExecute = options.preExecute

    if (this.autoClear && this.framebuffer) {
      this.clearCommand = new R.ClearCommand({
        color: new R.Color(0, 0, 0, 0),
        depth: 1,
        framebuffer: this.framebuffer,
        pass: R.Pass.OPAQUE,
      })
    }
  }

  createCommand(context: unknown): unknown {
    if (this.commandType === 'Draw') {
      const vertexArray = R.VertexArray.fromGeometry({
        context,
        geometry: this.geometry,
        attributeLocations: this.attributeLocations,
        bufferUsage: R.BufferUsage.STATIC_DRAW,
      })
      const shaderProgram = R.ShaderProgram.fromCache({
        context,
        attributeLocations: this.attributeLocations,
        vertexShaderSource: this.vertexShaderSource,
        fragmentShaderSource: this.fragmentShaderSource,
      })
      const renderState = R.RenderState.fromCache(this.rawRenderState)
      return new R.DrawCommand({
        owner: this,
        vertexArray,
        primitiveType: this.primitiveType,
        uniformMap: this.uniformMap,
        modelMatrix: R.Matrix4.IDENTITY,
        shaderProgram,
        framebuffer: this.framebuffer,
        renderState,
        pass: R.Pass.TRANSLUCENT,
      })
    }

    return new R.ComputeCommand({
      owner: this,
      fragmentShaderSource: this.fragmentShaderSource,
      uniformMap: this.uniformMap,
      outputTexture: this.outputTexture,
      persists: true,
    })
  }

  update(frameState: { context: unknown; commandList: unknown[] }): void {
    if (!this.show) return
    if (!R.defined(this.commandToExecute)) {
      this.commandToExecute = this.createCommand(frameState.context)
    }
    if (this.preExecute) this.preExecute()
    if (R.defined(this.clearCommand)) {
      frameState.commandList.push(this.clearCommand)
    }
    frameState.commandList.push(this.commandToExecute)
  }

  isDestroyed(): boolean {
    return false
  }

  destroy(): void {
    if (R.defined(this.commandToExecute)) {
      const cmd = this.commandToExecute as { shaderProgram?: { destroy: () => void } }
      if (cmd.shaderProgram) cmd.shaderProgram.destroy()
    }
    R.destroyObject(this)
  }
}
