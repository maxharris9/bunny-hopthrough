precision mediump float;

attribute vec3 aPosition;
attribute vec2 aUV;

uniform mat4 uProjection;
uniform mat4 uModel;
uniform mat4 uView;

uniform vec3 uTranslate;
varying vec2 uv;

void main () {
  gl_Position = uProjection * uView * uModel * vec4(aPosition * .1 + uTranslate, 1.0);
  uv = aUV;
}
