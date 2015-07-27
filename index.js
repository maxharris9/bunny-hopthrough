var Geometry = require('gl-geometry');
//var fit = require('canvas-fit');
var glShader = require('gl-shader');
var mat4 = require('gl-mat4');
//var normals = require('normals');
var glslify = require('glslify');
var dot = require('gl-vec3/dot');
var pick = require('camera-picking-ray');
//var intersect = require('ray-sphere-intersection');
var intersect = require('ray-plane-intersection');
var quad = require('primitive-quad')();
var gl = require('fc')(render, false, 3);
var camera = require('./camera')(gl.canvas, null, gl.dirty);
var distance = require('gl-vec3/distance');

var geometry = Geometry(gl);
geometry.attr('aPosition', quad.positions);
geometry.attr('aUV', quad.uvs, { size: 2 });
geometry.attr('aNormal', quad.normals);
geometry.faces(quad.cells);

// PSLG (Planar straight-line graphs)
// [0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1]
// [[1, 2], [2, 3], [3, 1]]

var sketch = {
  positions: [[-1, -1, 0], [1, 1, 0]],
  cells: [[0, 1]]
};

var sketchGeometry = Geometry(gl);
sketchGeometry.attr('aPosition', sketch.positions);
sketchGeometry.faces(sketch.cells, { size: 2 });

// Create the base matrices to be used
// when rendering the quad. Alternatively, can
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
  glslify('./shaders/quad.vert'),
  glslify('./shaders/quad.frag')
);

var sketchShader = glShader(
  gl,
  glslify('./shaders/sketch.vert'),
  glslify('./shaders/sketch.frag')
);

var circleShader = glShader(
  gl,
  glslify('./shaders/circle.vert'),
  glslify('./shaders/circle.frag')
);

// The logic/update loop, which updates all of the variables
// before they're used in our render function. It's optional
// for you to keep `update` and `render` as separate steps.
function update () {
  // Updates the width/height we use to render the final image.
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

function render () {
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
  // `shaders/quad.vert` and `shaders/quad.frag`.
  drawPlaneShader.uniforms.uProjection = projection;
  drawPlaneShader.uniforms.uView = view;
  drawPlaneShader.uniforms.uModel = model;

  // Finally: draws the quad to the screen! The rest is
  // handled in our shaders.
  geometry.draw(gl.TRIANGLES);
  geometry.unbind();

  sketchGeometry.bind(sketchShader);
  sketchShader.uniforms.uProjection = projection;
  sketchShader.uniforms.uView = view;
  sketchShader.uniforms.uModel = model;
  gl.lineWidth(1);
  sketchGeometry.draw(gl.LINES);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  geometry.bind(circleShader);

  for (var i = 0 ; i < sketch.positions.length; i++) {
    var vec = sketch.positions[i];
    // Updates our model/view/projection matrices, sending them
    // to the GPU as uniform variables that we can use in
    // `shaders/quad.vert` and `shaders/quad.frag`.
    circleShader.uniforms.uProjection = projection;
    circleShader.uniforms.uView = view;
    circleShader.uniforms.uModel = model;
    circleShader.uniforms.uTranslate = vec;
    circleShader.uniforms.color1 = (activePoint === i) ? [1.0, 0.6, 0.2, 1.0] : [0.0, 0.0, 0.0, 1.0];

    // Finally: draws the quad to the screen! The rest is
    // handled in our shaders.
    geometry.draw(gl.TRIANGLES);
  }

  geometry.unbind();
  gl.disable(gl.BLEND);
}

function projectMouseToPlane (event) {
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

window.addEventListener('click', handleMouseClick, true);
window.addEventListener('mousemove', handleMouseMove, true);

function findNearestPoint (point) {
  var result = {
    nearestPointIndex: 0,
    distance: undefined
  };

  for (var i = 0; i < sketch.positions.length; i++) {
    var dist = distance(point, sketch.positions[i]);
    if ((0 === i) || (dist < result.distance)) {
      result.distance = dist;
      result.nearestPointIndex = i;
    }
  }

  return result;
}

function handleMouseClick (event) {
  var selectionPointRadius = 0.1;

  var mouse3 = projectMouseToPlane(event);

  if (drawMode) {
    if (mouse3) {
      addPoint(mouse3);
      mutateAtIndex(sketch.positions.length - 1, mouse3);
    }
  }
  else {
    var nearestPoint = findNearestPoint(mouse3);

    if (nearestPoint.distance < selectionPointRadius) {
      // change the color of the point here
      console.log('you clicked on:', nearestPoint);
      activePoint = nearestPoint.nearestPointIndex;
    }
  }
}

function handleMouseMove (event) {
  var mouse3 = projectMouseToPlane(event);
  if (drawMode && mouse3) {
    mutateAtIndex(sketch.positions.length - 1, mouse3);
  }
}

function addPoint (newPoint) {
  var last = sketch.cells[sketch.cells.length - 1];

  sketch.positions.push(newPoint);
  sketch.cells.push([last[1], last[1] + 1]);
}

var activePoint = 0;
var drawMode = false;
var movablePointMode = false;

window.setDrawMode = function () {
  drawMode = !drawMode;
  console.log('setting drawMode:', drawMode);
};

window.setMovablePointMode = function () {
  movablePointMode = !movablePointMode;
};

window.closePath = function () {
  addPoint(sketch.positions[0]);
  updateSketchGeometry();
  gl.dirty();
};

function mutateAtIndex (index, value) {
  var item = sketch.positions[index];
  item[0] = value[0];
  item[1] = value[1];
  item[2] = value[2];

  updateSketchGeometry();
  gl.dirty();
}

function updateSketchGeometry () {
  // TODO: this is a horrible hack!
//sketchGeometry.dispose()
  sketchGeometry._attributes.length = 0;
  sketchGeometry._keys.length = 0;

  sketchGeometry.attr('aPosition', sketch.positions);
  sketchGeometry.faces(sketch.cells, { size: 2 });
}

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
