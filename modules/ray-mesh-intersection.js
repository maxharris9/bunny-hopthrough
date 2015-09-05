var v3sdist = require('gl-vec3/squaredDistance')


var cross = require('gl-vec3/cross');
var dot = require('gl-vec3/dot');
var sub = require('gl-vec3/subtract');

var edge1 = [0,0,0];
var edge2 = [0,0,0];
var tmp = [0, 0, 0];
var diff = [0, 0, 0];
var normal = [0, 0, 0];

function intersect (out, pt, dir, tri) {
  var a = tri[0];
  var b = tri[1];
  var c = tri[2];

  sub(edge1, b, a);
  sub(edge2, c, a);

  cross(normal, edge1, edge2);
  var det = dot(dir, normal);
  var sign;

  if (det > 0) {
    sign = 1;
  } else if (det < 0) {
    sign = -1;
    det = -det;
  } else {
    return null;
  }

  sub(diff, pt, a)

  var u = sign * dot(dir, cross(tmp, diff, edge2));
  if ( u < 0 ) {
    return null;
  }

  var v = sign * dot(dir, cross(tmp, edge1, diff));
  if (v < 0 || u + v > det) {
    return null;
  }

  var t = -sign * dot(diff, normal);
  if (t < 0) {
    return null;
  }

  var t = t / det;

  out[0] = dir[0] * t + pt[0];
  out[1] = dir[1] * t + pt[1];
  out[2] = dir[2] * t + pt[2];

  return out;
}


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
