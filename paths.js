var distance = require('gl-vec3/distance');
var Geometry = require('gl-geometry');
var poly2pslg = require('poly-to-pslg');
var cleanpslg = require('clean-pslg');
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

//////////// TODO: new file soon

function Paths () {
  Emitter.call(this);

  this.paths = [];

  // TODO: make this into a reference to selection
  // object which contains: [pointIndex, pointIndex2, pointIndex3...]
  this.activePath = -1;
}

inherits(Paths, Emitter);

Paths.prototype.newPath = function () {
  var p = new Path();
  this.paths.push(p);

  this.activePath = this.paths.length - 1;
};

Paths.prototype.setActivePath = function (pathIndex) {
  this.activePath = pathIndex;
};

Paths.prototype.addPoint = function (point) {
  var p = this.paths[this.activePath].addPoint(point);
  this.emit('dirty', this);
  return p;
};

Paths.prototype.closePath = function () {
  this.paths[this.activePath].closePath();
  this.emit('dirty', this);
};

Paths.prototype.openPath = function () {
  this.paths[this.activePath].openPath();
  this.emit('dirty', this);
};

Paths.prototype.mutatePoint = function (point) {
  if (this.activePath > -1) {
    this.paths[this.activePath].mutatePoint(point);
    this.emit('dirty', this);
  }
};

Paths.prototype.dump = function () {
  console.error('this.paths:', this.paths);
  console.error('this.activePath:', this.activePath);
};

Paths.prototype.findNearestPoint = function (point, selectionPointRadius) {
  for (var i = 0; i < this.paths.length; i++) {
    var result = this.paths[i].findNearestPoint(point);

    if ((undefined !== typeof result.distance) && (result.distance < selectionPointRadius)) {
      return {
        pathIndex: i,
        pointIndex: result.pointIndex,
        distance: result.distance
      };
    }
  }
};

Paths.prototype.render = function (sketchShader, circleShader, geometry, gl, projection, view, model) {
  for (var i = 0; i < this.paths.length; i++) {
    // TODO: cache sketchGeometry in each path
    var sketchGeometry = Geometry(gl);

    sketchGeometry.attr('aPosition', this.paths[i].getVertexes());
    sketchGeometry.faces(this.paths[i].getFaces(), { size: 2 });

    sketchGeometry.bind(sketchShader);
    sketchShader.uniforms.uProjection = projection;
    sketchShader.uniforms.uView = view;
    sketchShader.uniforms.uModel = model;
    gl.lineWidth(1);
    sketchGeometry.draw(gl.LINES);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    sketchGeometry.unbind();

    geometry.bind(circleShader);
    this.paths[i].render(circleShader, geometry, gl, projection, view, model);
    geometry.unbind();
  }
};

Paths.prototype.toPSLG = function() {
  // TODO: add filter for non-closed paths
  return cleanpslg(poly2pslg(this.paths.map(function(path) {
    return path.vertexes
  })));
};

module.exports = Paths;
