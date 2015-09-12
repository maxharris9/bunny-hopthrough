module.exports = TreeNode;

function TreeNode(parent) {
  this.parent = parent;
  this.children = [];
}

TreeNode.prototype.addChild = function addChild(child) {
  this.children.push(child);
  this.dirty = true;
}

TreeNode.prototype.removeChild = function removeChild(child) {
  var i = this.children.indexOf(child);
  if (i > -1) {
    this.children.splice(i, 1);
  }
  return this;
}

TreeNode.prototype.visit = function visitChildren(fn) {
  fn(this);

  var c = this.children;
  var l = c.length;
  for (var i=0; i<l; i++) {
    var child = c[i];
    if (child && typeof child.visit === 'function') {
      child.visit(fn);
    }
  }
}

