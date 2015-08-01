#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision mediump float;

#pragma glslify: aastep = require('glsl-aastep')

uniform vec4 color1;
uniform vec2 resolution;

varying float distanceToCamera;
varying vec2 uv;

void main () {

  float border = 0.1;
  float radius = 0.5;
  vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);

  float len = length(uv - 0.5);

  // //anti-alias
  len = aastep(radius, len);

  gl_FragColor = mix(color1, color0, len);
}
