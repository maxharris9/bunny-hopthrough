var test = require('tape');
var findStartingIndexes = require('./pslg');

test('basic success test', function (t) {
  var p = [[1, 2], [2, 3], [3, 1], [33, 66], [4, 5], [6, 7], [8, 9]];

  var indexes = findStartingIndexes(p, 2);

  t.deepEqual(indexes, [6, 5, 4, 3], 'found indexes');
  t.end();
});
