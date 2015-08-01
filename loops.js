var distance = require('gl-vec3/distance');

function Loops () {
  this.loops = []; // contains an array of loop arrays. i.e., [ [[0, 1], [1, 2], [2, 0]], [[3, 4], [5, 6]] ]
  this.points = []; // just a big array of points. i.e., [0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1]
}

Loops.prototype.newLoop = function () {
  this.loops.push([]);

  return this.loops.length - 1; // use this index to feed into whichLoop in subsequent calls
};

Loops.prototype.addEdge = function (whichLoop, edgeStartIndex, edgeEndIndex) {
  if (this.loops[whichLoop]) {
    this.loops[whichLoop].push([edgeStartIndex, edgeEndIndex]);
  }
};

Loops.prototype.addPoint = function (point) {
  // TODO: only push unique points
  this.points.push(point);

  return this.points.length - 1; // TODO: return actual point position if not adding new point
};

Loops.prototype.growLoop = function (whichLoop, point) {
  var newPointIndex = this.addPoint(point);

  var x = this.loops[whichLoop];

  if (x.length > 0) {
    var lastCell = x[x.length - 1];
    x.push([lastCell[1], newPointIndex]);
  }
  else { // we must be growing a brand-new loop

  }
};

Loops.prototype.closeLoop = function (whichLoop) {
  // loops should not have any gaps between the indexes,
  // so all we need to do is add a cell containing the largest and smallest indexes

  var largest = Number.NEGATIVE_INFINITY;
  var smallest = Number.POSITIVE_INFINITY;

  var item = this.loops[whichLoop];

  for (var i = 0; i < item.length; i++) {
    for (var j = 0; j < item[i].length; j++) {
      var index = item[i][j];

      largest = (index > largest) ? index : largest;
      smallest = (index < smallest) ? index : smallest;
    }
  }

  this.addEdge(whichLoop, smallest, largest);
};

Loops.prototype.mutatePoint = function (index, value) {
  var item = this.points[index];
  item[0] = value[0];
  item[1] = value[1];
  item[2] = value[2];
};

Loops.prototype.toPslg = function () {
  var cells = [];

  for (var i = 0; i < this.loops.length; i++) {
    for (var j = 0; j < this.loops[i].length; j++) {
      // TODO: only push unique items
      cells.push(this.loops[i][j]);
    }
  }

  return {
    positions: this.points,
    cells: cells
  };
};

Loops.prototype.dump = function () {
  console.error('this.loops:', this.loops);
  console.error('this.points:', this.points);
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
