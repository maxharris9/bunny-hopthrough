
var Geometry = require('gl-geometry');
var glShader = require('gl-shader');
var mat4 = require('gl-mat4');
var glslify = require('glslify');
var v3dot = require('gl-vec3/dot');
var v3add = require('gl-vec3/add');
var v3scale = require('gl-vec3/scale');
var v3cross = require('gl-vec3/cross');
var v3sub = require('gl-vec3/subtract');
var v3scale = require('gl-vec3/scale');
var v3norm = require('gl-vec3/normalize');
var v3copy = require('gl-vec3/copy');

var v3transformMat4 = require('gl-vec3/transformMat4');
var pick = require('camera-picking-ray');
var intersect = require('ray-plane-intersection');
var quad = require('primitive-quad')();
var EventEmitter = require('events').EventEmitter;
var fc = require('fc');
var createSolver = require('2d-constraints-bfgs');
var constraints = require('2d-constraints-bfgs/constraints');
var cdt2d = require('cdt2d');
var triangleNormal = window.triangleNormal = require('triangle-normal');
var triangleCenter = require('triangle-incenter');

var createMouseRay = require('./modules/create-mouse-ray');
var rayMeshIntersect = require('./modules/ray-mesh-intersection');
var extrudePSLG = require('./modules/extrude-pslg');
var computeCoplanarFaces = require('./modules/compute-coplanar-faces');
var findHoveredFace = require('./modules/find-hovered-face');
var createAABB = require('./modules/aabb');

var pslg2poly = require('pslg-to-poly');

var BinaryTree = require('./binarytree');
var BinaryTreeNode = require('./binarytreenode');

import { ConstraintList, ConstraintOptions } from './constraint-ui'
import React, { Component } from 'react'

var subModeEmitter = new EventEmitter();
var Paths = require('./paths');
var merge = require('merge');

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

var selectedToolbarButtonStyle = merge(true, toolbarButtonStyle, {
  textShadow: '0px 0px 3px #FFFFFF',
  color: 'white'
});

var mode = 'NONE';
var submode = 'NONE';

var extrusions = [];
var meshHovered = false;
var hoveredFace = false;

class Toolbar extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      mode: 'NONE'
    };

    this.panClick = this.panClick.bind(this);
    this.arrowClick = this.arrowClick.bind(this);
    this.drawClick = this.drawClick.bind(this);
    this.newPathClick = this.newPathClick.bind(this);
    this.selectPathClick = this.selectPathClick.bind(this);
  }

  panClick () {
    mode = 'NONE';
    this.setState({mode:'NONE'});
  }

  arrowClick () {
    enterTweakMode();
    this.setState({mode:'TWEAK'});
  }

  drawClick () {
    mode = 'DRAW';
    this.setState({mode:'DRAW'});
  }

  newPathClick () {
    mode = 'NEWPATH';
    this.setState({mode:'NEWPATH'});
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

  selectPathClick () {
    mode = 'SELECT_PATH';
    this.setState({mode:'SELECT_PATH'});
  }

  onExtrude () {
    extrudeSketch();
  }

  render () {
    // TODO: redraw the nice SVG arrow
    return (
      <div style={toolbarStyle}>
        <div style={this.state.mode === 'NONE' ? selectedToolbarButtonStyle : toolbarButtonStyle} onClick={this.panClick} title="Pan">
          P
        </div>
        <div style={toolbarButtonStyle} onClick={this.arrowClick} title='Arrow'>
          <svg enableBackground='new 0 0 24 24' id='Layer_1' version='1.0' viewBox='0 0 24 24' width='20' height='20'>
            <path d='M7,2l12,11.2l-5.8,0.5l3.3,7.3l-2.2,1l-3.2-7.4L7,18.5V2' fill={this.state.mode === 'TWEAK' ? 'white' : 'black'}
              filter='url(#arrowBlur)'/>
          </svg>
        </div>
        <div style={this.state.mode === 'DRAW' ? selectedToolbarButtonStyle : toolbarButtonStyle} onClick={this.drawClick} title='Polyline'>
          D
        </div>
        <div style={this.state.mode === 'NEWPATH' ? selectedToolbarButtonStyle : toolbarButtonStyle} onClick={this.newPathClick} title='New Path'>
          N
        </div>
        <div style={toolbarButtonStyle} onClick={this.deletePointClick} title='Delete selected point'>
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

        <div style={this.state.mode === 'SELECT_PATH' ? selectedToolbarButtonStyle : toolbarButtonStyle} onClick={this.selectPathClick} title="Path Selection Tool">
          Pa
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
    var positions = extrusion.positions;
    var extrudedGeometry = Geometry(gl);
    extrudedGeometry.attr('aPosition', positions);
    extrudedGeometry.attr('aNormal', extrusion.vertexNormals);
    extrudedGeometry.faces(extrusion.cells);
    extrudedGeometry.original = extrusion;
    extrudedGeometry.normalLines = Geometry(gl)

    var normalLineBuffer = [];
    var normalLineCells = []
    extrusion.cells.forEach(function(cell, i) {
      var j = i*2;
      normalLineCells.push(j)
      normalLineCells.push(j + 1)

      var center = triangleCenter([
        positions[cell[0]],
        positions[cell[1]],
        positions[cell[2]]
      ])

      var normal = triangleNormal(
        positions[cell[0]][0],
        positions[cell[0]][1],
        positions[cell[0]][2],

        positions[cell[1]][0],
        positions[cell[1]][1],
        positions[cell[1]][2],

        positions[cell[2]][0],
        positions[cell[2]][1],
        positions[cell[2]][2]
      )

      normalLineBuffer.push(center)

      v3add(
        normal,
        center,
        normal
      )

      normalLineBuffer.push(normal)
    })
    extrudedGeometry.normalLines.attr('aPosition', normalLineBuffer)
    extrudedGeometry.normalLines.faces(normalLineCells);


    extrudedGeometry.coplanarFaces = computeCoplanarFaces(extrusion).map(function(triangles) {

      var cells = triangles.map(function(triangleIndex) {
        return extrusion.cells[triangleIndex];
      })

      var aabb = createAABB();

      cells.forEach(cell => {
        aabb(positions[cell[0]])
        aabb(positions[cell[1]])
        aabb(positions[cell[2]])
      })

      var faceGeometry = Geometry(gl);
      faceGeometry.attr('aPosition', positions);
      faceGeometry.faces(cells);
      faceGeometry.original = {
        positions: positions,
        cells: cells,
        aabb: aabb(),
        triangles: triangles
      };
      faceGeometry.parent = extrudedGeometry;
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
  l.addPoint([-2, -1, 0]);
  l.addPoint([-1, 1, 0]);
  l.addPoint([1, 1, 0]);
  l.addPoint([1, -1, 0]);
  l.closePath();

  l.newPath();
  l.addPoint([0.5, 0, 0]);
  l.addPoint([1.5, 1.1, 0]);
//  l.addPoint([1.5, 1.5, 0]);
  l.addPoint([2.5, 0.5, 0]);
  l.closePath();

  // l.newPath();
  // l.addPoint([ 0.8901147952660535, -2.447353238204074, 0]);
  // l.addPoint([ -0.010354410389857183, -0.4656001673558111, 0]);
  // l.addPoint([ 0.3712552731269356, -0.26782341047477387, 0]);
  // l.addPoint([ 1.843293906596933, -1.484000599356814, 0]);
  // l.closePath();

  return l;
}

/*

var squircle = new BinaryTreeNode('or');
squircle.addLeftChild(paths.paths[0]);
squircle.addRightChild(paths.paths[2]);

var bt = new BinaryTree(squircle);

bt.reparent(new BinaryTreeNode(paths.paths[1]), 'sub', BinaryTree.RIGHT);

// var fishBite = new BinaryTreeNode('-');
// fishBite.addLeftChild('square2');
// fishBite.addRightChild('triangle');

// bt.reparent(fishBite, '+', BinaryTree.RIGHT);


*/

paths.on('dirty', function(paths) {
  extrusions.map(function(e) {
    e.dispose();
  });
  extrusions.length = 0;
//  extrudeSketch(.5);
  gl.dirty();
})

//extrudeSketch(.5);

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
  gl.disable(gl.CULL_FACE)

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

//  bt.render(sketchShader, gl, projection, view, model);

  paths.render(sketchShader, circleShader, geometry, gl, projection, view, model);

  geometry.unbind();

  gl.enable(gl.CULL_FACE)

  extrusions.forEach(function(extrusion, i) {
    extrusion.bind(extrudeShader);

      // Disabled for click-to-focus debugging
      // if (meshHovered && meshHovered.mesh === i) {
      //   extrudeShader.uniforms.color = [0.0, 0.0, 0.0, 0.45]
      // } else {
      //   extrudeShader.uniforms.color = [0.0, 0.0, 0.0, 0.5]
      // }

      extrudeShader.uniforms.uProjection = projection;
      extrudeShader.uniforms.uView = view;
      extrudeShader.uniforms.uModel = model;

      extrusion.draw(gl.TRIANGLES);
    extrusion.unbind();

    extrusion.normalLines.bind(sketchShader);

      sketchShader.uniforms.uProjection = projection;
      sketchShader.uniforms.uView = view;
      sketchShader.uniforms.uModel = model;

      extrusion.normalLines.draw(gl.LINES);
    extrusion.normalLines.unbind()
  })

  if (hoveredFace) {
    hoveredFace.bind(extrudeShader);

      extrudeShader.uniforms.color = [79/255, 192/255, 77/255, 1]
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
    -v3dot(sketchPlane.normal, sketchPlane.origin)
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

      case 'SELECT_PATH':
        var nearest = paths.findNearestLine(mouse3, 0.1);

        if (nearest) {
          paths.setActivePath(nearest.pathIndex);
        }
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

        if (hoveredFace) {
return;
          var aabb = hoveredFace.original.aabb

          var tmp = [0, 0, 0];
          var diff = [0, 0, 0]
          var center = [0, 0, 0];
          var eye = [0, 0, 0];

          // find the center of the bounding box. This will be the origin of
          // the plane
          v3add(center, v3scale(tmp, v3sub(diff, aabb[1], aabb[0]), 0.5), aabb[0])

          // TODO: figure out which way is up by using the largest dimension of the aabb

          var projView = mat4.multiply(mat4.create(), view, projection);
          var triangles = hoveredFace.original.triangles;
          var normal = hoveredFace.parent.original.faceNormals[triangles[0]];
          var tri = hoveredFace.parent.original.cells[triangles[0]];
          var v0 = hoveredFace.parent.original.positions[tri[0]];
          var v1 = hoveredFace.parent.original.positions[tri[1]];
          // var v2 = hoveredFace.parent.original.positions[tri[2]];

          // normal = triangleNormal(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2])
//           // var n1 = triangleNormal(v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], v0[0], v0[1], v0[2])
//           // var n2 = triangleNormal( v1[0], v1[1], v1[2], v0[0], v0[1], v0[2], v2[0], v2[1], v2[2])
//           console.log('normals',n0, normal)

//           var tnormal = v3transformMat4([0, 0, 0], normal, projView);
//           var tv0 = v3transformMat4([0, 0, 0], v0, projView);

// console.log(tnormal)
          //var ray = createMouseRay({x: width/2, y: width/2 }, width, height, projection, view);

//           var c = v3sub([0, 0, 0], tv0, ray.origin)
//           var det = v3dot(c, tnormal);

//           console.log(det);
// console.log('normal', normal)
          var scale = 5;//(det >= 0) ? 5 : -5
          v3scale(eye, normal, scale)
          console.log(eye)
          v3add(eye, eye, center)

          var daabb = v3sub([0, 0, 0], eye, aabb[0]);
          console.log('eye', eye)
          var up = v3cross([0, 0, 0], v3sub(tmp, center, eye), normal);
          console.log(up);
          camera.
          //camera.lookAt(eye, [0, .25, 0], [0, 0, -1])
          console.log(center)


          /*       ^ - up
                   |
              [ ]< - - - - - -> [ ]

          */

          var inormal = v3scale([0, 0, 0], normal, -1);
          var right = v3cross([0, 0, 0], inormal, v3norm([0, 0, 0], v3sub([0, 0, 0], center, v0)));
          v3norm(right, right)

          var up = v3cross([0, 0, 0], inormal, right);
          v3norm(up, up);
console.log('up', up)

          // var up = v3sub([0, 0, 0], v1, v0)//v3cross([0, 0, 0], ray.origin, center)


// from threejs-experiments
        // var radius = isect.face.ngonHelper.geometry.boundingSphere.radius;

        // var vFOV = camera.fov * Math.PI / 180;        // convert vertical fov to radians
        // var maintainDistance = 2.5 * Math.tan( vFOV / 2 ) * radius;

        // this.targetPosition = isect.face.normal.clone()
        //                                        .multiplyScalar(maintainDistance)
        //                                        .add(isect.face.ngonHelper.position)
        //                                        .add(isect.object.position);

        // this.targetCenter = isect.object.position.clone().add(isect.face.ngonHelper.position);
// end

          // camera.lookAt(eye, center, right)
          var ieye = v3norm([0, 0, 0], eye);
          console.error(ieye)

          function quatFromVec(out, da) {
            var x = da[0]
            var y = da[1]
            var z = da[2]
            var s = x*x + y*y
            if(s > 1.0) {
              s = 1.0
            }
            out[0] = -da[0]
            out[1] =  da[1]
            out[2] =  da[2] || Math.sqrt(1.0 - s)
            out[3] =  0.0
          }

          quatFromVec(camera.rotation, eye);
console.log('rotation', camera.rotation)
          camera.rotation[0] = ieye[0];
          camera.rotation[1] = ieye[1];
          camera.rotation[2] = ieye[2];
          camera.rotation[3] = 0;

          v3copy(camera.center, center)
          camera.distance = 5;
          gl.dirty()
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
  hoveredFace = findHoveredFace(extrusions, meshHovered);

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
