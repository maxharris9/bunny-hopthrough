var test = require('tape');
var Paths = require('./paths');

// TODO: fix this test
test('addPoint', function (t) {
  var paths = new Paths();

  paths.newPath();

  paths.addPoint(0, [0, 0, 0]);
  paths.addPoint(0, [0, 1, 0]);
  paths.addPoint(0, [1, 1, 0]);

  paths.closePath(0);

  t.end();
});
