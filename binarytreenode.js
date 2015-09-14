var overlay = require('overlay-pslg');
var poly2pslg = require('poly-to-pslg');

var latestId = 0;

function BinaryTreeNode (data, id) {
  this.leftChild = null;
  this.rightChild = null;
  this.data = data;
  this.id = ('undefined' === typeof id) ? latestId++ : id;
}

BinaryTreeNode.prototype.addLeftChild = function (data) {
  this.leftChild = new BinaryTreeNode(data);

  return this.leftChild;
};

BinaryTreeNode.prototype.addRightChild = function (data) {
  this.rightChild = new BinaryTreeNode(data);

  return this.rightChild;
};

BinaryTreeNode.prototype.isLeaf = function () {
  return null === this.leftChild && null === this.rightChild;
};

BinaryTreeNode.prototype.csg = function () {
  if (this.isLeaf()) {
    return poly2pslg(this.data.getVertices().map(function (item) { return [item[0], item[1]]; }));
  }
  else {
    var left = this.leftChild.csg();
    var right = this.rightChild.csg();

    // TODO: wrap pslg-overlay so that it doesn't store these separately
    if (right.red && right.blue) {
      right.edges = right.red.concat(right.blue)
    }

    if (left.red && left.blue) {
      left.edges = left.red.concat(left.blue)
    }

    return overlay(left.points, left.edges, right.points, right.edges, this.data);
  }
}

BinaryTreeNode.prototype.traverse = function (callback, currentDepth, branch, parentId, done) {
  callback(this, currentDepth, branch, parentId);

  currentDepth++; // important to do this before recursing into either child

  if (this.leftChild) {
    this.leftChild.traverse(callback, currentDepth, 'L', this.id);
  }

  if (this.rightChild) {
    this.rightChild.traverse(callback, currentDepth, 'R', this.id);
  }

  if (done) {
    done();
  }
};

module.exports = BinaryTreeNode;
