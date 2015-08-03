'use strict';

var Geometry = require('gl-geometry');
var glShader = require('gl-shader');
var mat4 = require('gl-mat4');
var glslify = require('glslify');
var dot = require('gl-vec3/dot');
var pick = require('camera-picking-ray');
var intersect = require('ray-plane-intersection');
var quad = require('primitive-quad')();
var fc = require('fc');
//var gl = require('fc')(render, false, 3);
var createSolver = require('2d-constraints-bfgs');
var constraints = require('2d-constraints-bfgs/constraints');

var Paths = require('./paths');

var solver = createSolver();

var React = require('react');

var toolbarButtonStyle = {
  border: '1px red',
  margin: '2px',
  background: 'orange',
  width: '25px',
  position: 'absolute',
  zIndex: 1
};

class Hello extends React.Component {
  arrowClick (event) {
    console.log('clicking arrow chooches');

    // event.stopPropagation();
  }

  render () {
    return (
      <div style={toolbarButtonStyle} onClick={this.arrowClick}>
        <svg enable-background="new 0 0 24 24" id="Layer_1" version="1.0" viewBox="0 0 24 24" width="20" height="20">
          <path d="M7,2l12,11.2l-5.8,0.5l3.3,7.3l-2.2,1l-3.2-7.4L7,18.5V2"/>
        </svg>
      </div>
    );
  }
}

initToolbar();

function initToolbar () {
  var toolbar = document.createElement('div');
  toolbar.id = 'toolbar';
  document.body.appendChild(toolbar);

  React.render(<Hello />, document.getElementById('toolbar'));
}

var gl = fc(render, false, 3);
var camera = require('./camera')(gl.canvas, null, gl.dirty);

var geometry = Geometry(gl);
geometry.attr('aPosition', quad.positions);
geometry.attr('aUV', quad.uvs, { size: 2 });
geometry.attr('aNormal', quad.normals);
geometry.faces(quad.cells);

// turn on webgl extensions
gl.getExtension('OES_standard_derivatives');

var paths = initSamplePaths();

function initSamplePaths () {
  var l = new Paths();

  l.newPath();

  l.addPoint([0, 0, 0]);
  l.addPoint([0, 1, 0]);
  l.addPoint([1, 1, 0]);

  l.closePath();

  l.newPath();

  l.addPoint([1, 0, 0]);
  l.addPoint([1.5, 1, 0]);
  l.addPoint([1.5, 1.5, 0]);
  l.addPoint([2.5, 0.5, 0]);

  //l.closePath();

  return l;
}

window.paths = paths;
window.constrain = constrain;
function constrain(name, args) {
  if (!constraints[name]) {
    console.error('constraint not found:', name);
    console.error('valid constraint names:', Object.keys(constraints).join(', '));
    return;
  }
  var insert = [constraints[name], args];
  solver.add(insert);
  try {
    if (!solver.solve()) {
      solver.remove(insert);
      console.error('the system became overconstrained when `%s` was added. It has been automatically removed', name);
    } else {
      gl.dirty();
    }
  } catch (e) {
    console.error('invalid arguments passed to', name);
  }
}

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

  paths.render(sketchShader, circleShader, geometry, gl, projection, view, model);

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

function handleMouseDown (event) {
  var selectionPointRadius = 0.1;

  var mouse3 = projectMouseToPlane(event);

  if (mouse3) {
    switch (mode) {
      case 'DRAW':
        paths.addPoint(mouse3);
        gl.dirty();
      break;

      case 'NEWLOOP':
        paths.newPath();

        paths.addPoint(mouse3);
        mode = 'NONE';
      break;

      case 'TWEAK': // jshint ignore:line
      default:
        var foundPoint = paths.findNearestPoint(mouse3, selectionPointRadius);
        if (foundPoint) {

          // TODO:
          // if !shift then clear the selection
          // add foundPoint to selection

          paths.setActivePath(foundPoint.pathIndex);

          // TODO: fix this
          paths.paths[foundPoint.pathIndex].setActivePoint(foundPoint.pointIndex);

          mode = 'POINTMOVING';
        }
      break;
    }
  }
}

function handleMouseUp () {
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

  if (mouse3) {
    switch (mode) {
      case 'DRAW':
        paths.mutatePoint(mouse3);
        gl.dirty();
      break;

      case 'POINTMOVING':
        var path = paths.paths[paths.activePath];
        if (!solver.isPointFixed(path.vertexes[path.activePoint])) {
          paths.mutatePoint(mouse3);
          solver.solve();
          gl.dirty();
        }

        event.stopPropagation();
      break;

      case 'TWEAK':
      break;

      default:
        console.log('mode not handled:', mode);
      break;
    }
  }
}

var mode = 'NONE';

window.setDrawMode = function () {
  mode = 'DRAW';
};

window.setTweakMode = function () {
  mode = 'TWEAK';
};

window.setNewPathMode = function () {
  mode = 'NEWLOOP';
};

window.closePath = function () {
  paths.closePath();

  gl.dirty();
};
