module.exports = createAABB;

var min = Math.min;
var max = Math.max;

function createAABB() {
  var aabb = [
    [Infinity, Infinity, Infinity],
    [-Infinity, -Infinity, -Infinity]
  ];

  return function update(coord) {
    if (coord) {
      var t0 = aabb[0];
      var t1 = aabb[1];

      t0[0] = min(coord[0], t0[0]);
      t0[1] = min(coord[1], t0[1]);
      t0[2] = min(coord[2], t0[2]);

      t1[0] = max(coord[0], t1[0]);
      t1[1] = max(coord[1], t1[1]);
      t1[2] = max(coord[2], t1[2]);
    }

    return aabb;
  }
}
