var distance = require('gl-vec3/distance');

function Path (ns, timestep) {
  this.ns = ns;
  this.timestep = timestep;

  this.timestep.val(ns, this);

  // an array of points
  // i.e., [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], [1.0, 1.0, 0.0], [0.0, 0.0, 1.0]
  this.val('vertices', [])
  // is this path closed (i.e., a polygon), or open (a polyline)?
  this.val('closed', false);

  // TODO: make this into a reference to selection
  // object which contains: [pointIndex, pointIndex2, pointIndex3...]
  this.val('activePoint', -1);
}

Path.prototype.val = function(key, value) {
  var ns = this.ns + '/' + key;
  if (typeof value !== 'undefined') {
    this.timestep.val(ns, value);
  }

  return this.timestep.val(ns);
}

Path.prototype.setActivePoint = function (index) {
  this.val('activePoint', index);
};

Path.prototype.addPoint = function (point) {
  this.val('vertices/', point)
  this.val('activePoint', this.val('vertices').length - 1);
};

Path.prototype.removePoint = function () {
  this.timestep.del(this.ns + '/verteces/' + this.val('activePoint'));
};

Path.prototype.mutatePoint = function (point) {
  var activePoint = this.val('activePoint');
  if (activePoint > -1) {
    this.val('vertices/' + activePoint + '/0', point[0]);
    this.val('vertices/' + activePoint + '/1', point[1]);
    this.val('vertices/' + activePoint + '/2', point[2]);
  }
};

Path.prototype.closePath = function () {
  this.val('closed', true);
};

Path.prototype.openPath = function () {
  this.val('closed', false);
};

Path.prototype.render = function (circleShader, geometry, gl, projection, view, model) {
  var verts = this.val('vertices');
  var l = verts.length;

  var activePoint = this.val('activePoint');

  for (var i = 0; i < l; i++) {
    circleShader.uniforms.uProjection = projection;
    circleShader.uniforms.uView = view;
    circleShader.uniforms.uModel = model;
    circleShader.uniforms.uTranslate = verts[i];
    circleShader.uniforms.color1 = (activePoint === i) ? [0.0, 1, 0, 1.0] : [0.0, 0.0, 0.0, 1.0];

    geometry.draw(gl.TRIANGLES);
  }
};

Path.prototype.findNearestPoint = function (point) {
  var result = {
    pointIndex: 0,
    distance: undefined
  };

  var verts = this.val('vertices');
  var l = verts.length;

  for (var i = 0; i < l; i++) {
    var dist = distance(point, verts[i]);
    if ((0 === i) || (dist < result.distance)) {
      result.distance = dist;
      result.pointIndex = i;
    }
  }

  return result;
};

Path.prototype.dump = function () {
  console.error('vertices:', this.val('vertices'));
  console.error('closed:', this.val('closed'));
  console.error('activePoint:', this.val('activePoint'));
};

Path.prototype.getVertices = function () {
  return this.val('vertices');
};

Path.prototype.getFaces = function () {
  var result = [];
  var verts = this.getVertices();
  var l = verts.length;
  for (var i = 0; i < l - 1; i++) {
    if (0 === result.length) {
      result.push([0, 1]);
    }
    else {
      result.push([i, i + 1]);
    }
  }
  if (this.closed) {
    result.push([l - 1, 0]);
  }

  return result;
};

module.exports = Path;
