var Emitter = require('tiny-emitter');
var inherits = require('util').inherits;
var Path = require('./path');
var poly2pslg = require('poly-to-pslg');
var cleanPSLG = require('clean-pslg');

var Geometry = require('gl-geometry');
var winding = require('./modules/path-winding');

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

Paths.prototype.findNearestLine = function (point, selectionPointRadius) {
  for (var i = 0; i < this.paths.length; i++) {
    var result = this.paths[i].findNearestLine(point, selectionPointRadius);

    if ((undefined !== typeof result.distance) && (result.distance < selectionPointRadius)) {
      return {
        pathIndex: i,
        pointIndex0: result.pointIndex0,
        pointIndex1: result.pointIndex1,
        distance: result.distance
      };
    }
  }
};

Paths.prototype.render = function (sketchShader, circleShader, geometry, gl, projection, view, model, drawPoints) {
  for (var i = 0; i < this.paths.length; i++) {
    // TODO: cache sketchGeometry in each path
    var sketchGeometry = Geometry(gl);

    sketchGeometry.attr('aPosition', this.paths[i].getVertexes());
    sketchGeometry.faces(this.paths[i].getFaces(), { size: 2 });

    sketchGeometry.bind(sketchShader);
    sketchShader.uniforms.uProjection = projection;
    sketchShader.uniforms.uView = view;
    sketchShader.uniforms.uModel = model;
    sketchShader.uniforms.color = (this.activePath === i) ? [0.0, 1, 0, 1.0] : [0.0, 0.0, 0.0, 1.0];
    gl.lineWidth(1);
    sketchGeometry.draw(gl.LINES);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    sketchGeometry.unbind();

    geometry.bind(circleShader);
    this.paths[i].render(circleShader, geometry, gl, projection, view, model, drawPoints);
    geometry.unbind();
  }
};

Paths.prototype.toPSLG = function() {
  // TODO: add filter for non-closed paths
  // TODO: merge shells
  // TODO: add cache for non-dirty paths

  var pslg = poly2pslg(this.paths.map(function(path) {
    // TODO: do we need to make a copy?
    var vertexes = path.vertexes.slice();

    if (vertexes.length > 2 && winding(vertexes) > 0) {
      vertexes.reverse();
    }

    return vertexes;
  }));

  return pslg;
};

module.exports = Paths;
