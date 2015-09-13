var fromValues = require('gl-vec3/fromValues')
var length = require('gl-vec3/length')

function magnitude (p1, p2) {
  var line = fromValues(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2])
  return length(line)
}

function minDistPointLine (testPoint, p1, p2) {
  var lineMagnitude = magnitude(p1, p2)

  var u = ( ( ( testPoint[0] - p1[0] ) * ( p2[0] - p1[0] ) ) +
            ( ( testPoint[1] - p1[1] ) * ( p2[1] - p1[1] ) ) +
            ( ( testPoint[2] - p1[2] ) * ( p2[2] - p1[2] ) ) ) /
            ( lineMagnitude * lineMagnitude );
  if (u < 0.0 || u > 1.0) {
    return undefined; // closest point does not fall within the line segment
  }

  var intersection = [0, 0, 0];
  intersection[0] = p1[0] + u * (p2[0] - p1[0]);
  intersection[1] = p1[1] + u * (p2[1] - p1[1]);
  intersection[2] = p1[2] + u * (p2[2] - p1[2]);

  return magnitude(testPoint, intersection)
}

module.exports = minDistPointLine;
