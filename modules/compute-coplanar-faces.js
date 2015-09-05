module.exports = computeCoplanarFaces

var m4det = require('gl-mat4/determinant')

var m4 = new Array(16);
var abs = Math.abs;

function pointsCoplanar(a, b, c, d) {

  m4[0] = a[0];
  m4[1] = a[1];
  m4[2] = a[2];
  m4[3] = 1;

  m4[4] = b[0];
  m4[5] = b[1];
  m4[6] = b[2];
  m4[7] = 1;

  m4[8]  = c[0];
  m4[9]  = c[1];
  m4[10] = c[2];
  m4[11] = 1;

  m4[12] = d[0];
  m4[13] = d[1];
  m4[14] = d[2];
  m4[15] = 1;

  return abs(m4det(m4)) < 0.1;
};

function facesAreCoplanar(a, b, c, a2, b2, c2) {
  return pointsCoplanar(a, b, c, a2) && pointsCoplanar(a2, b2, c2, a);
};

function near(a, b, eps) {
  for (var i=0; i<3; i++) {
    if (abs(a[i] - b[i]) > eps) {
      return false;
    }
  }
  return true;
}

function computeCoplanarFaces(simplicialComplex, eps) {
  eps = eps || 1e-2;
  var faces = simplicialComplex.cells;
  var verts = simplicialComplex.positions;
  var faceNormals = simplicialComplex.faceNormals;
  var i, j;

  // First, lets collect the normals.  We can assume that
  // if the face normals don't match, then they are not
  // going to be coplanar

  var coplanar = [];
  var coplanarNormals = [];
  for (i=0; i<faces.length; i++) {
    var normal1 = faceNormals[i];
    var combined = false;
    for (j=0; j<coplanar.length; j++) {
      var normal2 = coplanarNormals[j];

      if (near(normal1, normal2, eps)) {

        // If the normals are matching then we have a candidate for
        // a coplanar match
        var face = faces[i]
        var coplanarFace = coplanar[j][0]

        var res = facesAreCoplanar(
          verts[face[0]],
          verts[face[1]],
          verts[face[2]],
          verts[coplanarFace[0]],
          verts[coplanarFace[1]],
          verts[coplanarFace[2]]
        );

        if (res) {
          coplanar[j].push(face);
          combined = true;
          break;
        }
      }
    }

    if (!combined) {
      coplanarNormals.push(normal1);
      coplanar.push([faces[i]]);
    }
  }

  return coplanar;
};
