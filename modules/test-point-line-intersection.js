var minDistPointLine = require('./point-line-intersection')
var test = require('tape')

test('test cases', function (t) {
  t.equals(minDistPointLine([1, 0, 0], [0, 0, 0], [1, 1, 0]), 0.7071067811865476, 'got expected result')
  t.equals(minDistPointLine([32, 32, 32], [0, 0, 0], [1, 1, 0]), -1, 'got expected result')
  t.equals(minDistPointLine([1, 0, 0], [0, 0, 0], [1, 1, 1]), 0.8164966052612204, 'got expected result')
  t.equals(minDistPointLine([0.1, 0.2, 0.3], [0, 0, 0], [1, 1, 0]), 0.3082207119931578, 'got expected result')
  t.equals(minDistPointLine([3, 2, 3], [1, 2, 3], [3, 2, 1]), 1.4142135623730951, 'got expected result')
  t.equals(minDistPointLine([2, 2, 2], [0, 0, 0], [3, 2, 1]), 1.3093073999465534, 'got expected result')
  t.end()
})
