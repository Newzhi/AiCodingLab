/**
 * Cesium renderer internals (ComputeCommand, DrawCommand, etc.) are not in public typings.
 * Pattern from https://cesium.com/blog/2019/04/29/gpu-powered-wind/
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Cesium from 'cesium'

export const R = Cesium as any

export type CesiumContext = any
export type CesiumTexture = any
export type CesiumFramebuffer = any
