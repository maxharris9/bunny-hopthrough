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

BinaryTreeNode.prototype.addLeftNode = function (node) {
  this.leftChild = node;

  return this.leftChild;
};

BinaryTreeNode.prototype.addRightNode = function (node) {
  this.rightChild = node;

  return this.rightChild;
};

BinaryTreeNode.prototype.traverse = function (callback, currentDepth, branch, parentId, done) {
  callback(this.data, this.id, currentDepth, branch, parentId);

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
