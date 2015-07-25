//vec2 p = gl_FragCoord.xy / screenDim_.xy;
//vec2 circleCenter = vec2(0.5,0.5);
//float dist = length(p - circleCenter _);
//float circle = smoothstep(circleRadius_,circleRadius_ - 0.05,dist);



//varying vec2 uv;
//
//uniform mat4 uProjection;
//uniform mat4 uModel;
//uniform mat4 uView;
//
//void main () {
//  gl_Position = uProjection * uView * uMode * gl_Vertex;
//  uv = vec2(gl_MultiTexCoord0);
//}

// Our vertex shader is run once for each of these
// vectors, to determine the final position of the vertex
// on the screen and pass data off to the fragment shader.

precision mediump float;

// Our attributes, i.e. the arrays of vectors in the bunny mesh.
attribute vec3 aPosition;

uniform mat4 uProjection;
uniform mat4 uModel;
uniform mat4 uView;
uniform vec3 uTranslate;

void main() {

  // - `uProjection` will apply our perspective matrix, and
  // - `uView` will apply our camera transforms.
  // - `uModel` is unused here, but is traditionally used to
  //   move the object around the scene.
  gl_Position = uProjection * uView * uModel * vec4(aPosition * .1 + uTranslate, 1.0);
}
