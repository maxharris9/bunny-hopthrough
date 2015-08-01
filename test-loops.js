var test = require('tape');
var Loops = require('./loops');

test('basic success test', function (t) {
  var loops = new Loops();

  loops.addPoint([0, 0, 0]);
  loops.addPoint([0, 1, 0]);

  var currentLoop = loops.newLoop();
  loops.addEdge(currentLoop, 0, 1); // create a new loop, connect the first two points

  loops.growLoop(currentLoop, [1, 1, 0]);
  loops.closeLoop(currentLoop);

  var output = loops.toPslg();

  t.deepEqual(output, {
    positions: [ [ 0, 0, 0 ], [ 0, 1, 0 ], [ 1, 1, 0 ] ],
    cells: [ [ 0, 1 ], [ 1, 2 ], [0, 2] ]
  }, 'found indexes');

  t.end();
});
