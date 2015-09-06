var BinaryTreeNode = require('./binarytreenode');

function BinaryTree (root) {
  if (root) {
    this.root = root;
  }
}

BinaryTree.prototype.reparent = function (binaryTreeNode, op, side) {
  var tmp = new BinaryTreeNode(op);

  if (side === 0) {
    tmp.leftChild = this.root;
    tmp.rightChild = binaryTreeNode;
    this.root = tmp;
  }
  else if (side === 1) {
    tmp.leftChild = binaryTreeNode;
    tmp.rightChild = this.root;
    this.root = tmp;
  }
  else {
    console.error('invalid side chosen; \'side\' must be 0 (left) or 1 (right), not:', side);
  }
};

BinaryTree.prototype.render = function (testcb) {
  var tmp = [];
  this.root.traverse(
    function callback (data, id, currentDepth, branch, parentId) {
      tmp.push({ data: data, id: id, branch: branch, parentId: parentId });
    },
    0,
    'ROOT',
    this.root.id,
    function done () {
      testcb(tmp);
    }
  );
};

BinaryTree.prototype.LEFT = 0;
BinaryTree.prototype.RIGHT = 1;

module.exports = BinaryTree;
