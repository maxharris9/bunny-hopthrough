var tape = require('tape');
var BinaryTree = require('./binarytree');
var BinaryTreeNode = require('./binarytreenode');

tape('', function (t) {
  var squircle = new BinaryTreeNode('+');
  squircle.addLeftChild('square');
  squircle.addRightChild('circle');

  var fishBite = new BinaryTreeNode('-');
  fishBite.addLeftChild('square2');
  fishBite.addRightChild('triangle');

  var bt = new BinaryTree(squircle);
  bt.renderTest(function (lines) {
    t.deepEquals(lines,
      [ { data: '+', id: 0, branch: 'ROOT', parentId: 0 },
        { data: 'square', id: 1, branch: 'L', parentId: 0 },
        { data: 'circle', id: 2, branch: 'R', parentId: 0 } ],
      'got expected structure back'
    );
  });

  bt.reparent(fishBite, '+', BinaryTree.RIGHT);
  bt.renderTest(function (lines) {
    t.deepEquals(lines,
      [ { data: '+', id: 6, branch: 'ROOT', parentId: 6 },
        { data: '-', id: 3, branch: 'L', parentId: 6 },
        { data: 'square2', id: 4, branch: 'L', parentId: 3 },
        { data: 'triangle', id: 5, branch: 'R', parentId: 3 },
        { data: '+', id: 0, branch: 'R', parentId: 6 },
        { data: 'square', id: 1, branch: 'L', parentId: 0 },
        { data: 'circle', id: 2, branch: 'R', parentId: 0 } ],
      'got expected structure back'
    );
  });

  t.end();
});
