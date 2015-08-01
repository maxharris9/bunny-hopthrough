var distance = require('gl-vec3/distance');
var Geometry = require('gl-geometry');

function Loops () {
  this.loops = []; // contains an array of loop arrays. i.e., [ [[0, 1], [1, 2], [2, 0]], [[3, 4], [5, 6]] ]
  this.points = []; // just a big array of points. i.e., [0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1]

  this.activeLoop = 0;
  this.activePoint = 0;
}

Loops.prototype.newLoop = function () {
  this.loops.push([]);

  this.activeLoop = this.loops.length - 1;
};

Loops.prototype.addEdge = function (edgeStartIndex, edgeEndIndex) {
  var l = this.loops[this.activeLoop];
  if (l) {
    l.push([edgeStartIndex, edgeEndIndex]);
  }
};

Loops.prototype.addPoint = function (point) {
  // TODO: only push unique points
  this.points.push(point);

  return this.points.length - 1; // TODO: return actual point position if not adding new point
};

Loops.prototype.growLoop = function (point) {
  var newPointIndex = this.addPoint(point);

  var x = this.loops[this.activeLoop];

  if (x.length > 0) {
    var lastCell = x[x.length - 1];
    x.push([lastCell[1], newPointIndex]);
  }
  else { // we must be growing a brand-new loop

  }
};

Loops.prototype.closeLoop = function () {
  // loops should not have any gaps between the indexes,
  // so all we need to do is add a cell containing the largest and smallest indexes

  var largest = Number.NEGATIVE_INFINITY;
  var smallest = Number.POSITIVE_INFINITY;

  var item = this.loops[this.activeLoop];

  for (var i = 0; i < item.length; i++) {
    for (var j = 0; j < item[i].length; j++) {
      var index = item[i][j];

      largest = (index > largest) ? index : largest;
      smallest = (index < smallest) ? index : smallest;
    }
  }

  this.addEdge(smallest, largest);
};

Loops.prototype.mutatePoint = function (index, value) {
  var item = this.points[index];
  item[0] = value[0];
  item[1] = value[1];
  item[2] = value[2];
};

// PSLG (Planar straight-line graphs)
// [0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1]
// [[1, 2], [2, 3], [3, 1]]
Loops.prototype.toPslg = function () {
  return {
    positions: this.points,
    cells: this.generateCells()
  };
};

Loops.prototype.generateCells = function () {
  var cells = [];

  for (var i = 0; i < this.loops.length; i++) {
    for (var j = 0; j < this.loops[i].length; j++) {
      // TODO: only push unique items
      cells.push(this.loops[i][j]);
    }
  }

  return cells;
};

Loops.prototype.dump = function () {
  console.error('this.loops:', this.loops);
  console.error('this.points:', this.points);
};

Loops.prototype.render = function (sketchShader, circleShader, geometry, gl, projection, view, model, activePoint) {
  var sketch = this.generateCells();
  var sketchGeometry = Geometry(gl);

  sketchGeometry.attr('aPosition', this.points);
  sketchGeometry.faces(sketch, { size: 2 });

  sketchGeometry.bind(sketchShader);
  sketchShader.uniforms.uProjection = projection;
  sketchShader.uniforms.uView = view;
  sketchShader.uniforms.uModel = model;
  gl.lineWidth(1);
  sketchGeometry.draw(gl.LINES);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  geometry.bind(circleShader);

  for (var i = 0 ; i < this.points.length; i++) {
    circleShader.uniforms.uProjection = projection;
    circleShader.uniforms.uView = view;
    circleShader.uniforms.uModel = model;
    circleShader.uniforms.uTranslate = this.points[i];
    circleShader.uniforms.color1 = (activePoint === i) ? [1.0, 0.6, 0.2, 1.0] : [0.0, 0.0, 0.0, 1.0];

    geometry.draw(gl.TRIANGLES);
  }
};

Loops.prototype.findNearestPoint = function (point) {
  var result = {
    nearestPointIndex: 0,
    distance: undefined
  };

  for (var i = 0; i < this.points.length; i++) {
    var dist = distance(point, this.points[i]);
    if ((0 === i) || (dist < result.distance)) {
      result.distance = dist;
      result.nearestPointIndex = i;
    }
  }

  return result;
};

module.exports = Loops;
