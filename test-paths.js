var test = require('tape');
var Paths = require('./paths');

test('basic success test', function (t) {
  var paths = new Paths();

  paths.addPoint([0, 0, 0]);
  paths.addPoint([0, 1, 0]);

  paths.newPath();
  paths.addEdge(0, 1); // create a new path, connect the first two points

  paths.growPath([1, 1, 0]);
  paths.closePath();

  var output = paths.toPslg();

  t.deepEqual(output, {
    positions: [ [ 0, 0, 0 ], [ 0, 1, 0 ], [ 1, 1, 0 ] ],
    cells: [ [ 0, 1 ], [ 1, 2 ], [0, 2] ]
  }, 'found indexes');

  t.end();
});
