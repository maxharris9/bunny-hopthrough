//precision mediump float;
//
//void main (void) {
//   vec2 pos = mod(gl_FragCoord.xy, vec2(50.0)) - vec2(25.0);
//   float dist_squared = dot(pos, pos);
//
//   gl_FragColor = mix(vec4(.90, .90, .90, 1.0), vec4(.20, .20, .40, 1.0), step(400.0, dist_squared));
//}

//varying vec2 uv;
//
//void main () {
//  float border = 0.01;
//  float radius = 0.5;
//  vec4 color0 = vec4(0.0, 0.0, 0.0, 1.0);
//
//  vec4 color1 = vec4(1.0, 1.0, 1.0, 1.0);
//
//  vec2 m = uv - vec2(0.5, 0.5);
//  float dist = radius - sqrt(m.x * m.x + m.y * m.y);
//
//  float t = 0.0;
//  if (dist > border) {
//    t = 1.0;
//  }
//  else if (dist > 0.0) {
//    t = dist / border;
//  }
//
//  gl_FragColor = mix(color0, color1, t);
//}
//

precision mediump float;

void main() {
  gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
}
