var v3mul = require('gl-vec3/multiply');
var v3add = require('gl-vec3/add');
var cdt2d = require('cdt2d');

module.exports = extrudePSLG;

var v3scratch = [0, 0, 0];
var v3multiplier = [0, 0, 0];

function extrudePSLG(pslg, normal, distance) {
  v3multiplier[0] = distance;
  v3multiplier[1] = distance;
  v3multiplier[2] = distance;
  var toAdd = v3mul(v3scratch, normal, v3multiplier);

  // edges do not need to be copied because they are not mutated.
  var points = pslg.points.slice();
  var pl = points.length;

  // expand points to include the top surface
  for (var i=0; i<pl; i++) {
    var point = points[i];
    points.push(v3add([0, 0, 0], point, toAdd));
  }

  // triangulate the pslg internally
  var e = cdt2d(pslg.points, pslg.edges, { exterior: false })

  // copy the triangulation edges
  var el = e.length;
  for (var i=0; i<el; i++) {
    e.push(e[i].map(function(a) {
      return a + pl;
    }));
  }

  var edges = pslg.edges;
  var el = edges.length;
  var n = pl-1;
  for (var i=0; i<el; i++) {
    /*

      1:0        1:1
        o--------o - extruded surface (top)
        .      . .
        .    .   .
        .  .     .
        .        .
        o--------o - original surface (bottom)
      0:0        0:1

    */


    // build 2 triangles
    // [0:0, 1:1, 1:0]
    e.push([
      i,
      i+pl,
      i+pl-1,
    ]);

    // [0:0, 0:1, 1:1]
    e.push([
      i,
      i+1,
      i+pl,
    ]);
  }

  return {
    positions: points,
    cells: e
  }
}
