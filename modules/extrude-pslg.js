var v3mul = require('gl-vec3/multiply');
var v3add = require('gl-vec3/add');
var cdt2d = require('cdt2d');
var normals = require('normals');
var triangleNormal = require('triangle-normal');
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
  var faceNormals = [];

  // triangulate the pslg internally
  var cells = cdt2d(pslg.points, pslg.edges, { exterior: false })
  // copy the triangulation edges w/ translation
  var cellsLength = cells.length;
  for (var i=0; i<cellsLength; i++) {
    cells.push(cells[i].reverse().map(function(a) {
      return a + pl;
    }).reverse());
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
    //   o--------o - extruded surface (b)
    //   .      . .
    //   .    .   .
    //   .  .     .
    //   .        .
    //   o--------o - original surface (a)
    // 0:0        0:1

    // build 2 triangles
    var edge = edges[i];
    var a = edge[0];
    var b = edge[1];
    var apl = a + pl;
    var bpl = b + pl;

    cells.push([a, bpl, apl])
    cells.push([a, b, bpl])
  }

  return {
    positions: points,
    cells: cells,
    faceNormals: cells.map(function(cell) {
      return triangleNormal(
        points[cell[0]][0],
        points[cell[0]][1],
        points[cell[0]][2],

        points[cell[1]][0],
        points[cell[1]][1],
        points[cell[1]][2],

        points[cell[2]][0],
        points[cell[2]][1],
        points[cell[2]][2]
      )
    }),
    vertexNormals: normals.vertexNormals(cells, points)
  }
}
