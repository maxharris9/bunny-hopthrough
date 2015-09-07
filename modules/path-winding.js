module.exports = winding;

var orientation = require('robust-orientation');

function winding(points) {
  return points.reduce(function (v, c, i) {
    var p = points[(i-1 < 0) ? points.length - 1 : i-1];
    var n = points[(i+1) % points.length];

    return orientation(p, c, n);
  }, 0)
}
