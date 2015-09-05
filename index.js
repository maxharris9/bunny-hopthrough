
var Geometry = require('gl-geometry');
var glShader = require('gl-shader');
var mat4 = require('gl-mat4');
var glslify = require('glslify');
var dot = require('gl-vec3/dot');
var pick = require('camera-picking-ray');
var intersect = require('ray-plane-intersection');
var quad = require('primitive-quad')();
var EventEmitter = require('events').EventEmitter;
var fc = require('fc');
var createSolver = require('2d-constraints-bfgs');
var constraints = require('2d-constraints-bfgs/constraints');
var cdt2d = require('cdt2d');

var createMouseRay = require('./modules/create-mouse-ray');
var rayMeshIntersect = require('./modules/ray-mesh-intersection');
var extrudePSLG = require('./modules/extrude-pslg');
var computeCoplanarFaces = require('./modules/compute-coplanar-faces');
var findHoveredFace = require('./modules/find-hovered-face');

import { ConstraintList, ConstraintOptions } from './constraint-ui'
import React, { Component } from 'react'

var subModeEmitter = new EventEmitter();
var Paths = require('./paths');

var sketchPlane = {
  normal: [0, 0, 1],
  origin: [0, 0, 0]
};

var solver = createSolver();

var toolbarStyle = {
  margin: '2px',
  background: 'orange',
  width: '25px',
  position: 'absolute',
  zIndex: 1,
  '-o-user-select': 'none',
  '-moz-user-select': 'none',
  '-khtml-user-select': 'none',
  '-webkit-user-select': 'none'
};

var toolbarButtonStyle = {
  border: '1px red',
  background: 'orange',
  width: '25px',
  textAlign: 'center',
  lineHeight: '25px',
  position: 'relative',
  cursor: 'pointer',
  zIndex: 1
};

var mode = 'NONE';
var submode = 'NONE';

var extrusions = [];
var meshHovered = false;

class Toolbar extends React.Component {
  panClick () {
    mode = 'NONE';
  }

  arrowClick () {
    enterTweakMode();
  }

  drawClick () {
    mode = 'DRAW';
  }

  newPathClick () {
    mode = 'NEWPATH';
    // don't cancel here so the global mouse handler can properly setup
    // the new path.
  }

  deletePointClick () {
    var aPath = paths.paths[paths.activePath];
    aPath.vertexes.splice(aPath.activePoint, 1);

    gl.dirty();
  }

  closePathClick () {
    paths.closePath();

    gl.dirty();
  }

  openPathClick () {
    paths.openPath();

    gl.dirty();
  }

  addConstraintClick () {
    submode = 'ADDCONSTRAINT';

    var constraintElement = document.createElement('div');
    constraintElement.id = 'constraints';
    document.body.appendChild(constraintElement);

    function handleClose() {
      if (constraintElement && constraintElement.parentNode) {
        React.unmountComponentAtNode(constraintElement);
        submode = 'NONE';
      }
    }

    React.render((
      <ConstraintList
        constraints={constraints}
        constrain={constrain}
        emitter={subModeEmitter}
        handleClose={handleClose} />
      ), constraintElement);
  }

  onExtrude () {
    extrudeSketch();
  }

  render () {
    // TODO: redraw the nice SVG arrow
    return (
      <div style={toolbarStyle}>
        <div style={toolbarButtonStyle} onClick={this.panClick} title="Pan">
          P
        </div>
        <div style={toolbarButtonStyle} onClick={this.arrowClick} title="Arrow">
          <svg enable-background="new 0 0 24 24" id="Layer_1" version="1.0" viewBox="0 0 24 24" width="20" height="20">
            <path d="M7,2l12,11.2l-5.8,0.5l3.3,7.3l-2.2,1l-3.2-7.4L7,18.5V2"/>
          </svg>
        </div>
        <div style={toolbarButtonStyle} onClick={this.drawClick} title="Polyline">
          D
        </div>
        <div style={toolbarButtonStyle} onClick={this.newPathClick} title="New Path">
          N
        </div>
        <div style={toolbarButtonStyle} onClick={this.deletePointClick} title="Delete selected point">
          X
        </div>

        <div style={toolbarButtonStyle} onClick={this.closePathClick} title="Close selected path">
          Cl
        </div>
        <div style={toolbarButtonStyle} onClick={this.openPathClick} title="Open selected path">
          Op
        </div>
        <div style={toolbarButtonStyle} onClick={this.addConstraintClick} title="Add Constraint">
          C
        </div>
        <div style={toolbarButtonStyle} onClick={this.onExtrude} title="Extrude">
          Ex
        </div>
      </div>
    );
  }
}

initToolbar();

function initToolbar () {
  var toolbar = document.createElement('div');
  toolbar.id = 'toolbar';
  document.body.appendChild(toolbar);

  React.render(<Toolbar />, document.getElementById('toolbar'));
}

function extrudeSketch(d) {
  d  = d || parseFloat(prompt('extrude distance?'));
  // var d = 1;
  if (!isNaN(d) && d) {

    var pslg = paths.toPSLG();

    var extrusion = extrudePSLG(pslg, sketchPlane.normal, d);

    var extrudedGeometry = Geometry(gl);
    extrudedGeometry.attr('aPosition', extrusion.positions);
    extrudedGeometry.faces(extrusion.cells);
    extrudedGeometry.original = extrusion;

    extrudedGeometry.coplanarFaces = computeCoplanarFaces(extrusion).map(function(cells) {
      var faceGeometry = Geometry(gl);
      faceGeometry.attr('aPosition', extrusion.positions);
      faceGeometry.faces(cells);
      faceGeometry.original = {
        positions: extrusion.positions,
        cells: cells
      };
      return faceGeometry;
    })

    extrusions.push(extrudedGeometry);
  }
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

  l.closePath();

  return l;
}

paths.on('dirty', function(paths) {
  extrusions.map(function(e) {
    e.dispose();
  });
  extrusions.length = 0;
  extrudeSketch(.5);
  gl.dirty();
})

extrudeSketch(.5);

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
    console.error(e.stack)
    solver.remove(insert);
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

var extrudeShader = glShader(
  gl,
  glslify('./shaders/extrude.vert'),
  glslify('./shaders/extrude.frag')
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

  extrusions.forEach(function(extrusion, i) {
    extrusion.bind(extrudeShader);

      if (meshHovered && meshHovered.mesh === i) {
        extrudeShader.uniforms.color = [0.0, 0.0, 1.0, 1]
      } else {
        extrudeShader.uniforms.color = [0.0, 0.0, 1.0, 0.75]
      }

      extrudeShader.uniforms.uProjection = projection;
      extrudeShader.uniforms.uView = view;
      extrudeShader.uniforms.uModel = model;

      extrusion.draw(gl.TRIANGLES);
    extrusion.unbind();
  })

  var hoveredFace = findHoveredFace(extrusions, meshHovered);
  if (hoveredFace) {
    hoveredFace.bind(extrudeShader);

      extrudeShader.uniforms.color = [1.0, 0.0, 1.0, 0.75]
      extrudeShader.uniforms.uProjection = projection;
      extrudeShader.uniforms.uView = view;
      extrudeShader.uniforms.uModel = model;

      hoveredFace.draw(gl.TRIANGLES);
    hoveredFace.unbind();
  }


  gl.disable(gl.BLEND);
}

function projectMouseToPlane (event) {
  var out = [0, 0, 0];
  var ray = createMouseRay(event, width, height, projection, view);

  return intersect(
    out,
    ray.origin,
    ray.direction,
    sketchPlane.normal,
    -dot(sketchPlane.normal, sketchPlane.origin)
  );
}

function mousePickFace(event) {
  var ray = createMouseRay(event, width, height, projection, view);
  return rayMeshIntersect(ray.origin, ray.direction, extrusions.map(e => e.original));
}

window.addEventListener('mousedown', handleMouseDown, true);
window.addEventListener('mouseup', handleMouseUp, true);
window.addEventListener('mousemove', handleMouseMove, true);
document.body.addEventListener('keydown', handleKeyDown, true);

function handleMouseDown (event) {
  var selectionPointRadius = 0.1;

  if (event.target !== gl.canvas) {
    return;
  }

  var mouse3 = projectMouseToPlane(event);

  if (mouse3) {
    switch (mode) {
      case 'DRAW':
        paths.addPoint(mouse3);
        gl.dirty();
      break;

      case 'NEWPATH':
        paths.newPath();

        // we have to clone mouse3 here because if we
        // add the same point twice, path.mutatePoint()
        // will change both points!
        paths.addPoint(mouse3.slice());

        // this is a point that may or may not become
        // a part of the final path, depending on whether
        // the user cancels next
        paths.addPoint(mouse3);
        mode = 'DRAW';
        gl.dirty();
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
          var path = paths.paths[foundPoint.pathIndex];
          path.setActivePoint(foundPoint.pointIndex);

          mode = 'POINTMOVING';

          subModeEmitter.emit('point-selected', paths.paths[foundPoint.pathIndex].vertexes[path.activePoint])

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
  meshHovered = mousePickFace(event);

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

function handleKeyDown(ev) {
  switch (ev.keyCode) {
    case 27:
      switch (mode) {
        case 'DRAW':
          enterTweakMode();
        break;
      }

    break;
  }
}

function enterTweakMode () {
  if ('DRAW' === mode) {
    var x = paths.paths[paths.activePath];
    x.vertexes.pop();
    paths.emit('dirty');
  }
  mode = 'TWEAK';
};
