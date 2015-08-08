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
  var edges = pslg.edges;
  var el = edges.length;

  // triangulate the pslg internally
  var extrusion = cdt2d(pslg.points, pslg.edges, { exterior: false })
  // copy the triangulation edges w/ translation
  var extrusionLength = extrusion.length;
  for (var i=0; i<extrusionLength; i++) {
    extrusion.push(extrusion[i].map(function(a) {
      return a + pl;
    }));
  }

  // expand points to include the top surface
  for (var i=0; i<pl; i++) {
    var point = points[i];
    points.push(v3add([0, 0, 0], point, toAdd));
  }

  var el = edges.length;
  var n = pl-1;
  var start = 0;
  var last = 0;
  for (var i=0; i<el; i++) {
    // 1:0        1:1
    //   o--------o - extruded surface (top)
    //   .      . .
    //   .    .   .
    //   .  .     .
    //   .        .
    //   o--------o - original surface (bottom)
    // 0:0        0:1

    // build 2 triangles
    var edge = edges[i];
    var a = edge[0];
    var b = edge[1];

    extrusion.push([a, b + pl, a + pl]);
    extrusion.push([a, b, b + pl]);
  }

  return {
    positions: points,
    cells: extrusion
  }
}
