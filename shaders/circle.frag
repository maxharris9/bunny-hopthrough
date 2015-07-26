precision mediump float;
varying vec2 uv;

void main () {
  float border = 0.01;
  float radius = 0.5;
  vec4 color1 = vec4(0.0, 0.0, 0.0, 1.0);
  vec4 color0 = vec4(0.0, 0.0, 0.0, 0.0);

  vec2 m = uv - vec2(0.5, 0.5);
  float dist = radius - sqrt(m.x * m.x + m.y * m.y);

  float t = 0.0;
  if (dist > border) {
    t = 1.0;
  }
  else if (dist > 0.0) {
    t = dist / border;
  }

  gl_FragColor = mix(color0, color1, t);
}
