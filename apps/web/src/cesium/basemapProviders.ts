import { Credit, UrlTemplateImageryProvider } from 'cesium'

/** Esri World Imagery — free global fallback when OSM is unreachable. */
export function createEsriFallbackBasemapProvider(): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    credit: new Credit(
      'Tiles © Esri — Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, IGP',
    ),
    maximumLevel: 19,
  })
}

/** OpenStreetMap raster tiles — primary basemap. See https://operations.osmfoundation.org/policies/tiles/ */
export function createOsmBasemapProvider(): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    credit: new Credit(
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ),
    maximumLevel: 19,
  })
}

/** Esri World Hillshade — free global relief overlay (no Ion token). */
export function createHillshadeProvider(): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
    credit: new Credit('Hillshade © Esri — World Hillshade'),
    maximumLevel: 15,
  })
}

/** Road-emphasis overlay (OSM France HOT). Toggle via 路网 layer. */
export function createRoadsOverlayProvider(): UrlTemplateImageryProvider {
  return new UrlTemplateImageryProvider({
    url: 'https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    credit: new Credit(
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · HOT overlay',
    ),
    maximumLevel: 18,
  })
}
