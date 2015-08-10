var distance = require('gl-vec3/distance');
var Geometry = require('gl-geometry');
var poly2pslg = require('poly-to-pslg');
var cleanPSLG = require('clean-pslg');
var overlayPSLG = require('clean-pslg');
var Emitter = require('tiny-emitter');
var inherits = require('util').inherits

function Path () {
  // an array of points
  // i.e., [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], [1.0, 1.0, 0.0], [0.0, 0.0, 1.0]
  this.vertexes = [];

  // is this path closed (i.e., a polygon), or open (a polyline)?
  this.closed = false;

  // TODO: make this into a reference to selection
  // object which contains: [pointIndex, pointIndex2, pointIndex3...]
  this.activePoint = -1;
}

Path.prototype.setActivePoint = function (index) {
  this.activePoint = index;
};

Path.prototype.addPoint = function (point) {
  this.vertexes.push(point);
  this.activePoint = this.vertexes.length - 1;
};

Path.prototype.removePoint = function () {
  this.vertexes.splice(this.activePoint, 1);
};

Path.prototype.mutatePoint = function (point) {
  if (this.activePoint > -1) {
    var vertex = this.vertexes[this.activePoint];

    vertex[0] = point[0];
    vertex[1] = point[1];
    vertex[2] = point[2];
  }
};

Path.prototype.closePath = function () {
  this.closed = true;
};

Path.prototype.openPath = function () {
  this.closed = false;
};

Path.prototype.render = function (circleShader, geometry, gl, projection, view, model) {
  for (var i = 0; i < this.vertexes.length; i++) {
    circleShader.uniforms.uProjection = projection;
    circleShader.uniforms.uView = view;
    circleShader.uniforms.uModel = model;
    circleShader.uniforms.uTranslate = this.vertexes[i];
    circleShader.uniforms.color1 = (this.activePoint === i) ? [0.0, 1, 0, 1.0] : [0.0, 0.0, 0.0, 1.0];

    geometry.draw(gl.TRIANGLES);
  }
};

Path.prototype.findNearestPoint = function (point) {
  var result = {
    pointIndex: 0,
    distance: undefined
  };

  var vertexes = this.vertexes;

  for (var i = 0; i < vertexes.length; i++) {
    var dist = distance(point, vertexes[i]);
    if ((0 === i) || (dist < result.distance)) {
      result.distance = dist;
      result.pointIndex = i;
    }
  }

  return result;
};

Path.prototype.dump = function () {
  console.error('this.vertexes:', this.vertexes);
  console.error('this.closed:', this.closed);
  console.error('this.activePoint:', this.activePoint);
};

Path.prototype.getVertexes = function () {
  return this.vertexes;
};

Path.prototype.getFaces = function () {
  var result = [];

  for (var i = 0; i < this.vertexes.length - 1; i++) {
    if (0 === result.length) {
      result.push([0, 1]);
    }
    else {
      result.push([i, i + 1]);
    }
  }
  if (this.closed) {
    result.push([this.vertexes.length - 1, 0]);
  }

  return result;
};
