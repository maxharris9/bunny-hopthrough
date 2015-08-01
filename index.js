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

var findStartingIndexes = require('./pslg');

var Loops = require('./loops');

var geometry = Geometry(gl);
geometry.attr('aPosition', quad.positions);
geometry.attr('aUV', quad.uvs, { size: 2 });
geometry.attr('aNormal', quad.normals);
geometry.faces(quad.cells);

// turn on webgl extensions
gl.getExtension('OES_standard_derivatives');

// PSLG (Planar straight-line graphs)
// [0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1]
// [[1, 2], [2, 3], [3, 1]]

// var sketch = {
//   positions: [[-1, -1, 0], [1, 1, 0], [1, -1, 0]],
//   cells: [[0, 1]]
// };

var loops = new Loops();

loops.addPoint([-1, -1, 0]);
loops.addPoint([ 1,  1, 0]);

var activeLoop = loops.newLoop(); // TODO: internalize activeLoop state into the Loops object
loops.addEdge(activeLoop, 0, 1); // create a new loop, connect the first two points

loops.growLoop(activeLoop, [1, -1, 0]);
loops.closeLoop(activeLoop);

var sketch = loops.toPslg();

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

window.addEventListener('mousedown', handleMouseDown, true);
window.addEventListener('mouseup', handleMouseUp, true);
window.addEventListener('mousemove', handleMouseMove, true);


var firstEdgeMode = false; // fuck this is a nasty hair! TODO: fix!
var firstEdgeModeIndex0 = 0; // so is this

function handleMouseDown (event) {
  var selectionPointRadius = 0.1;

  var mouse3 = projectMouseToPlane(event);



  switch (mode) {
    case 'DRAW':
      if (mouse3) {
console.log('activeLoop:', activeLoop);

var firstEdgeModeIndex1 = loops.addPoint(mouse3);
activePoint = firstEdgeModeIndex1;

if (firstEdgeMode) {
  loops.addEdge(activeLoop, firstEdgeModeIndex0, firstEdgeModeIndex1);
  firstEdgeMode = false;
}
else {
  loops.growLoop(activeLoop, mouse3);
}
        updateSketchGeometry();
        gl.dirty();
      }
    break;

    case 'NEWLOOP':
      if (mouse3) {
        activeLoop = loops.newLoop();
firstEdgeModeIndex0 = loops.addPoint(mouse3);
activePoint = firstEdgeModeIndex0;
firstEdgeMode = true;
        mode = 'NONE';
      }
    break;

    case 'TWEAK':
    default:
      var nearestPoint = loops.findNearestPoint(mouse3);

      if (nearestPoint.distance < selectionPointRadius) {
        activePoint = nearestPoint.nearestPointIndex;
        mode = 'POINTMOVING';
      }
    break;
  }
}

function handleMouseUp (event) {
  switch (mode) {
    case 'POINTMOVING':
      mode = 'TWEAK';
    break;

    default:
    break;
  }
}

function handleMouseMove (event) {
  var mouse3 = projectMouseToPlane(event);
  switch (mode) {
    case 'DRAW':
      if (mouse3) {
        loops.mutatePoint(activePoint, mouse3);

        updateSketchGeometry();
        gl.dirty();
      }
    break;

    case 'POINTMOVING':
      if (mouse3) {
        loops.mutatePoint(activePoint, mouse3);

        updateSketchGeometry();
        gl.dirty();

        event.stopPropagation();
      }
    break;

    case 'TWEAK':
    break;

    default:
      console.log('mode not handled:', mode);
    break;
  }
}

var activePoint = 0;

var mode = 'NONE';

window.setDrawMode = function () {
  mode = 'DRAW';
};

window.setTweakMode = function () {
  mode = 'TWEAK';
};

window.setNewLoopMode = function () {
  mode = 'NEWLOOP';
}

window.sketch = sketch;

window.closePath = function () {
  loops.closeLoop(activeLoop);

  updateSketchGeometry();
  gl.dirty();
};

function updateSketchGeometry () {
  // TODO: render more directly, without converting to PSLG first?
  sketch = loops.toPslg();

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
