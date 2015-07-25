var Geometry = require('gl-geometry');
var fit      = require('canvas-fit');
var glShader = require('gl-shader');
var mat4     = require('gl-mat4');
var normals  = require('normals');
var glslify  = require('glslify');
//var bunny    = require('bunny')

var dot = require('gl-vec3/dot');

var pick = require('camera-picking-ray');
//var intersect = require('ray-sphere-intersection');
var intersect = require('ray-plane-intersection');

//var radius = 1;
// var bunny = require('primitive-sphere')(radius, {
//   segments: 16
// });

var bunny = require('primitive-quad')();

// Creates a canvas element and attaches
// it to the <body> on your DOM.
var canvas = document.body.appendChild(document.createElement('canvas'));

// Creates an instance of canvas-orbit-camera,
// which later will generate a view matrix and
// handle interaction for you.
var camera = require('canvas-orbit-camera')(canvas);

// A small convenience function for creating
// a new WebGL context – the `render` function
// supplied here is called every frame to draw
// to the screen.
var gl = require('gl-context')(canvas, render);

// Resizes the <canvas> to fully fit the window
// whenever the window is resized.
window.addEventListener('resize', fit(canvas), false);

// Load the bunny mesh data (a simplicial complex)
// into a gl-geometry instance, calculating vertex
// normals for you. A simplicial complex is simply
// a list of vertices and faces – conventionally called
// `positions` and `cells` respectively. If you're familiar
// with three.js, this is essentially equivalent to an array
// of `THREE.Vector3` and `THREE.Face3` instances, except specified
// as arrays for simplicity and interoperability.
var geometry = Geometry(gl);

geometry.attr('aPosition', bunny.positions);
geometry.attr('aNormal', normals.vertexNormals(
  bunny.cells,    // [[1, 2, 3], [3, 4, 5]]
  bunny.positions // [[0, 0, 0], [1, 0, 0]]
));

geometry.faces(bunny.cells);

// PSLG (Planar straight-line graphs)
// [[1, 2], [2, 3], [3, 1]]
// [0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1]

var sketch = {
  positions: [[-1, -1, 0], [1, 1, 0]],
  cells: [[0, 1]]
};

var sketchGeometry = Geometry(gl);

sketchGeometry.attr('aPosition', sketch.positions);
sketchGeometry.faces(sketch.cells, { size: 2 });

// Create the base matrices to be used
// when rendering the bunny. Alternatively, can
// be created using `new Float32Array(16)`
var projection = mat4.create();
var model      = mat4.create();
var view       = mat4.create();
var height;
var width;

// Pulls up our shader code and returns an instance
// of gl-shader. Using the glslify browserify transform,
// these will be passed through glslify first to pull in
// any external GLSL modules (of which there are none in
// this example) and perform the uniform/attribute parsing
// step ahead of time. We can make some dramatic file size
// savings by doing this in Node rather then at runtime in
// the browser.

var drawPlaneShader = glShader(
  gl,
  glslify('./shaders/bunny.vert'),
  glslify('./shaders/bunny.frag')
);

var sketchShader = glShader(
  gl,
  glslify('./shaders/sketch.vert'),
  glslify('./shaders/sketch.frag')
);

// The logic/update loop, which updates all of the variables
// before they're used in our render function. It's optional
// for you to keep `update` and `render` as separate steps.
function update() {
  // Updates the width/height we use to render the
  // final image.
  width  = gl.drawingBufferWidth;
  height = gl.drawingBufferHeight;

  // Updates the view matrix via the camera state
  camera.view(view);

  // Optionally, flush the state of the camera. Required
  // for user input to work correctly.
  camera.tick();

  // Update our projection matrix. This is the bit that's
  // responsible for taking 3D coordinates and projecting
  // them into 2D screen space.
  var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  var fieldOfView = Math.PI / 4;
  var near = 0.01;
  var far  = 100;

  mat4.perspective(
    projection,
    fieldOfView,
    aspectRatio,
    near,
    far
  );
}

function render() {
  update();

  // Sets the viewport, i.e. tells WebGL to draw the
  // scene across the full canvas.
  gl.viewport(0, 0, width, height);

  // Enables depth testing, which prevents triangles
  // from overlapping.
  // gl.enable(gl.DEPTH_TEST)

  // Enables face culling, which prevents triangles
  // being visible from behind.
  // gl.enable(gl.CULL_FACE)

  // Binds the geometry and sets up the shader's attribute
  // locations accordingly.
  geometry.bind(drawPlaneShader);

  // Updates our model/view/projection matrices, sending them
  // to the GPU as uniform variables that we can use in
  // `shaders/bunny.vert` and `shaders/bunny.frag`.
  drawPlaneShader.uniforms.uProjection = projection;
  drawPlaneShader.uniforms.uView = view;
  drawPlaneShader.uniforms.uModel = model;

  // Finally: draws the bunny to the screen! The rest is
  // handled in our shaders.
  geometry.draw(gl.TRIANGLES);




  sketchShader.bind();

  // Binds the geometry and sets up the shader's attribute
  // locations accordingly.
  sketchGeometry.bind(sketchShader);


  // Updates our model/view/projection matrices, sending them
  // to the GPU as uniform variables that we can use in
  // `shaders/bunny.vert` and `shaders/bunny.frag`.
  sketchShader.uniforms.uProjection = projection;
  sketchShader.uniforms.uView = view;
  sketchShader.uniforms.uModel = model;
  gl.lineWidth(2);
  sketchGeometry.draw(gl.LINES);
}

// function handleMouse (event) {
//   //console.log('click', event.x, event.y);

//   var ray = {
//     origin: [0, 0, 0],
//     direction: [0, 0, 0]
//   };

//   var mouse = [event.x, event.y];
//   var viewport = [0, 0, width, height];

//   var projView = mat4.multiply([], projection, view)
//   var invProjView = mat4.invert([], projView);

//   pick(ray.origin, ray.direction, mouse, viewport, invProjView);


//   var center = [0, 0, 0];
//   var hit = intersect([], ray.origin, ray.direction, center, radius);

//   if (hit) {
// console.log(' dir:', ray.direction);
// console.log('orig:', ray.origin);
//     console.log('sphere hit:', hit);
//   }
// }

function updateSketchGeometry(position, mouse3) {
console.log('mouse3:', mouse3);
  position[0] = mouse3[0];
  position[1] = mouse3[1];
  position[2] = mouse3[2];

console.log('cells:', sketch.cells.join(';'), 'position length:', sketch.positions.length);
  // TODO: this is a horrible hack!
  //sketchGeometry.dispose()
  sketchGeometry._attributes.length = 0;
  sketchGeometry._keys.length = 0;

  sketchGeometry.attr('aPosition', sketch.positions);
  sketchGeometry.faces(sketch.cells, { size: 2 });
}

function projectMouseToPlane(event) {
  var out = [0, 0, 0];

  var ray = {
    origin: [0, 0, 0],
    direction: [0, 0, 0]
  };

  var mouse = [event.x, event.y];
  var viewport = [0, 0, width, height];

  var projView = mat4.multiply([], projection, view);
  var invProjView = mat4.invert([], projView);

  pick(ray.origin, ray.direction, mouse, viewport, invProjView);

  //var center = [0, 0, 0];
  // TODO: compute the actual plane normal
  var planeNormal = [0, 0, -1];
  return intersect(out, ray.origin, ray.direction, planeNormal, -dot(planeNormal, [1, 0, 0]));
}

gl.canvas.addEventListener('click', handleMouseClick, true);
gl.canvas.addEventListener('mousemove', handleMouseMove, true);

function handleMouseClick(event) {
  if (!drawMode) { return; }

  var mouse3 = projectMouseToPlane(event);

  if (mouse3) {
    var length = sketch.positions.length;
    var last = sketch.cells[sketch.cells.length - 1];
    sketch.positions.push(mouse3);
    sketch.cells.push([last[1], last[1] + 1]);
    console.log(sketch);
    updateSketchGeometry(sketch.positions[length - 1], mouse3);
  }
}

function handleMouseMove (event) {
  if (!drawMode) { return; }

  var mouse3 = projectMouseToPlane(event);
  if (mouse3) {
    var last = sketch.positions[sketch.positions.length - 1];
    updateSketchGeometry(last, mouse3);
  }
}

var drawMode = false;
window.setDrawMode = function () {
  drawMode = !drawMode;
  console.log('setting drawMode:', drawMode);
};

/*
/// externals:

the plane,
matrices,
PSLG management:
  - a way to add points,
  - remove points,
  - move points,
  - close the path (by using topology: sketch.cells) - by typing a command in the console `closePath()`
  // https://github.com/mikolalysenko/simplicial-complex might help
*/
