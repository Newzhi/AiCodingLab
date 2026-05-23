export const FULLSCREEN_VERT = `
in vec3 position;
in vec2 st;
out vec2 v_textureCoordinates;
void main() {
  v_textureCoordinates = st;
  gl_Position = vec4(position, 1.0);
}
`

export const CALCULATE_SPEED_FRAG = `
uniform sampler2D U;
uniform sampler2D V;
uniform sampler2D currentParticlesPosition;
uniform vec3 dimension;
uniform vec3 minimum;
uniform vec3 interval;
uniform vec2 uSpeedRange;
uniform vec2 vSpeedRange;
uniform float pixelSize;
uniform float speedFactor;

in vec2 v_textureCoordinates;
out vec4 outputColor;

vec2 mapPositionToNormalizedIndex2D(vec3 lonLatLev) {
  lonLatLev.x = mod(lonLatLev.x + 180.0, 360.0) - 180.0;
  lonLatLev.y = clamp(lonLatLev.y, -90.0, 90.0);
  vec3 index3D = vec3(0.0);
  index3D.x = (lonLatLev.x - minimum.x) / interval.x;
  index3D.y = (lonLatLev.y - minimum.y) / interval.y;
  vec2 normalizedIndex2D = vec2(index3D.x / dimension.x, index3D.y / dimension.y);
  return normalizedIndex2D;
}

float getWindComponent(sampler2D componentTexture, vec3 lonLatLev) {
  return texture(componentTexture, mapPositionToNormalizedIndex2D(lonLatLev)).r;
}

float interpolateTexture(sampler2D componentTexture, vec3 lonLatLev) {
  float lon = lonLatLev.x;
  float lat = lonLatLev.y;
  float lon0 = floor(lon / interval.x) * interval.x;
  float lon1 = lon0 + interval.x;
  float lat0 = floor(lat / interval.y) * interval.y;
  float lat1 = lat0 + interval.y;
  float lon0_lat0 = getWindComponent(componentTexture, vec3(lon0, lat0, 0.0));
  float lon1_lat0 = getWindComponent(componentTexture, vec3(lon1, lat0, 0.0));
  float lon0_lat1 = getWindComponent(componentTexture, vec3(lon0, lat1, 0.0));
  float lon1_lat1 = getWindComponent(componentTexture, vec3(lon1, lat1, 0.0));
  float lon_lat0 = mix(lon0_lat0, lon1_lat0, (lon - lon0) / interval.x);
  float lon_lat1 = mix(lon0_lat1, lon1_lat1, (lon - lon0) / interval.x);
  return mix(lon_lat0, lon_lat1, (lat - lat0) / interval.y);
}

vec2 lengthOfLonLat(vec3 lonLatLev) {
  float latitude = radians(lonLatLev.y);
  float latLength = 111132.92 - 559.82 * cos(2.0 * latitude) + 1.175 * cos(4.0 * latitude);
  float longLength = 111412.84 * cos(latitude) - 93.5 * cos(3.0 * latitude);
  return vec2(longLength, latLength);
}

vec3 convertSpeedUnitToLonLat(vec3 lonLatLev, vec3 speed) {
  vec2 lonLatLength = lengthOfLonLat(lonLatLev);
  return vec3(speed.x / lonLatLength.x, speed.y / lonLatLength.y, 0.0);
}

void main() {
  float speedScaleFactor = speedFactor * pixelSize;
  vec3 lonLatLev = texture(currentParticlesPosition, v_textureCoordinates).rgb;
  vec3 speed = vec3(interpolateTexture(U, lonLatLev), interpolateTexture(V, lonLatLev), 0.0);
  vec3 speedInLonLat = convertSpeedUnitToLonLat(lonLatLev, speed) * speedScaleFactor;
  vec3 percent = vec3(
    (speed.x - uSpeedRange.x) / max(uSpeedRange.y - uSpeedRange.x, 1e-6),
    (speed.y - vSpeedRange.x) / max(vSpeedRange.y - vSpeedRange.x, 1e-6),
    0.0
  );
  outputColor = vec4(speedInLonLat, length(percent));
}
`

export const UPDATE_POSITION_FRAG = `
uniform sampler2D currentParticlesPosition;
uniform sampler2D particlesSpeed;
in vec2 v_textureCoordinates;
out vec4 outputColor;
void main() {
  vec3 lonLatLev = texture(currentParticlesPosition, v_textureCoordinates).rgb;
  vec3 speed = texture(particlesSpeed, v_textureCoordinates).rgb;
  outputColor = vec4(lonLatLev + speed, 0.0);
}
`

export const POST_PROCESS_POSITION_FRAG = `
uniform sampler2D nextParticlesPosition;
uniform sampler2D particlesSpeed;
uniform vec2 lonRange;
uniform vec2 latRange;
uniform float randomCoefficient;
uniform float dropRate;
uniform float dropRateBump;
in vec2 v_textureCoordinates;
out vec4 outputColor;

const vec3 randomConstants = vec3(12.9898, 78.233, 4375.85453);

float rand(vec2 seed, vec2 range) {
  vec2 randomSeed = randomCoefficient * seed;
  float temp = dot(randomConstants.xy, randomSeed);
  temp = fract(sin(temp) * (randomConstants.z + temp));
  return temp * (range.y - range.x) + range.x;
}

void main() {
  vec3 nextParticle = texture(nextParticlesPosition, v_textureCoordinates).rgb;
  vec4 nextSpeed = texture(particlesSpeed, v_textureCoordinates);
  float speedNorm = nextSpeed.a;
  float particleDropRate = dropRate + dropRateBump * speedNorm;
  vec2 seed1 = nextParticle.xy + v_textureCoordinates;
  vec2 seed2 = nextSpeed.xy + v_textureCoordinates;
  float randomLon = rand(seed1, lonRange);
  float randomLat = rand(-seed2, latRange);
  float randomNumber = rand(seed2, vec2(0.0, 1.0));
  bool outbound = nextParticle.y < latRange.x || nextParticle.y > latRange.y
    || nextParticle.x < lonRange.x || nextParticle.x > lonRange.y;
  if (randomNumber < particleDropRate || outbound) {
    outputColor = vec4(randomLon, randomLat, 0.0, 1.0);
  } else {
    outputColor = vec4(nextParticle, 0.0);
  }
}
`

export const POINT_DRAW_VERT = `
in vec2 st;
uniform sampler2D currentParticlesPosition;
uniform float particleHeight;
out float v_speedNorm;

void main() {
  vec4 pos = texture(currentParticlesPosition, st);
  v_speedNorm = pos.w;
  vec3 ll = pos.rgb;
  vec3 positionMC = czm_geodeticToCartesian(vec3(radians(ll.x), radians(ll.y), particleHeight));
  gl_Position = czm_modelViewProjection * vec4(positionMC, 1.0);
  gl_PointSize = 2.5;
}
`

export const POINT_DRAW_FRAG = `
uniform vec4 particleColor;
in float v_speedNorm;
out vec4 outColor;
void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  if (dot(c, c) > 0.25) discard;
  outColor = vec4(particleColor.rgb, particleColor.a * (0.5 + 0.5 * clamp(v_speedNorm, 0.0, 1.0)));
}
`
