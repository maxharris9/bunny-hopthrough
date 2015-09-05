module.exports = findHoveredFace;

// where meshArray is an array of simplicial complexes
// and hovered object is the result of `ray-mesh-intersection`

function findHoveredFace(meshArray, hoveredObject) {
  if (!hoveredObject) {
    return false;
  }

  var mesh = meshArray[hoveredObject.mesh];
  var tri = mesh.original.cells[hoveredObject.triangle];

  var coplanarFaces = mesh.coplanarFaces;
  var cfl = coplanarFaces.length;
  for (var i=0; i<cfl; i++) {
    var faces = coplanarFaces[i].original.cells;

    var fl = faces.length;
    for (var j=0; j<fl; j++) {
      var face = faces[j]

      if (tri[0] === face[0] && tri[1] === face[1] && tri[2] === face[2]) {
        return coplanarFaces[i];
      }
    }
  }

  return false;
}
