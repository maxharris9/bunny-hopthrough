var intersect = require('ray-triangle-intersection')
var v3sdist = require('gl-vec3/squaredDistance')

module.exports = rayMeshIntersection

function rayMeshIntersection(ro, rd, scArray) {
  var l = scArray.length;
  var tri = [0, 0, 0];
  var out = [0, 0, 0]

  var intersections = []

  for (var i=0; i<l; i++) {
    var sc = scArray[i];

    var el = sc.cells.length;
    var p = sc.positions;
    var c = sc.cells;
    for (var j=0; j<el; j++) {
      var cell = c[j];
      tri[0] = p[cell[0]]
      tri[1] = p[cell[1]]
      tri[2] = p[cell[2]]
      if (intersect(out, ro, rd, tri)) {
        intersections.push({
          mesh: i,
          triangle: j,
          pos: out,
          distance: v3sdist(ro, out)
        })
      }
    }
  }

  if (!intersections.length) {
    return false;
  }

  intersections.sort(function(a, b) {
    return a.distance - b.distance
  })

  return intersections[0];
}
