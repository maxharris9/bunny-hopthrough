precision mediump float;

uniform vec4 color;
varying vec3 vNormal;
void main () {
  gl_FragColor = vec4(max(normalize(vNormal + 1.0), color.rgb), 1.0);
}
