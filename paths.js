var Emitter = require('tiny-emitter');
var inherits = require('util').inherits;
var Path = require('./path');
var poly2pslg = require('poly-to-pslg');
var cleanPSLG = require('clean-pslg');
var Timestep = require('timestep');

var Geometry = require('gl-geometry');
var winding = require('./modules/path-winding');

function Paths () {
  this.database = new Timestep();
  this.paths = this.database.val('paths', []);

  this.emitter = new Emitter();

  // TODO: make this into a reference to selection
  // object which contains: [pointIndex, pointIndex2, pointIndex3...]
  this.activePath = -1;
}

Paths.prototype.applyUpdate = function(array) {
  var time = array[0];
  var path = array[1];
  var op = array[2];
  var val = array[3];

  var pathParts = path.split('/');

  // mutate a path
  if (pathParts.length === 1) {
    if (op === '+') {
      console.error('ADD PATH')
    } else {

    }
  } else {

  }
}

Paths.prototype.newPath = function () {
  this.activePath = this.database.val('paths').length;
  var ns = 'paths/' + this.activePath;
  // TODO: give paths a unique ID
  var p = new Path(ns, this.database);
  this.database.val(ns, p);
};

Paths.prototype.setActivePath = function (pathIndex) {
  this.activePath = pathIndex;
};

Paths.prototype.addPoint = function (point) {
  var p = this.paths[this.activePath].addPoint(point);
  this.emitter.emit('dirty', this);
  return p;
};

Paths.prototype.closePath = function () {
  this.paths[this.activePath].closePath();
  this.emitter.emit('dirty', this);
};

Paths.prototype.openPath = function () {
  this.paths[this.activePath].openPath();
  this.emitter.emit('dirty', this);
};

Paths.prototype.mutatePoint = function (point) {
  if (this.activePath > -1) {
    this.paths[this.activePath].mutatePoint(point);
    this.emitter.emit('dirty', this);
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

    sketchGeometry.attr('aPosition', this.paths[i].getVertices());
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
  // TODO: merge shells
  // TODO: add cache for non-dirty paths

  var pslg = poly2pslg(this.paths.map(function(path) {
    // TODO: do we need to make a copy?
    var verts = path.getVertices().slice();

    if (verts.length > 2 && winding(verts) > 0) {
      verts.reverse();
    }

    return verts;
  }));

  return pslg;
};

module.exports = Paths;
