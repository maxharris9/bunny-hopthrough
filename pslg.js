function findStartingIndexes (pslg, dimensions) {
  var seen = {};

  for (var i = 0; i < pslg.length; i++) {
    var item = pslg[i];
    for (var j = 0; j < item.length; j++) {
      var key = String(item[j]);
      if (!seen[key]) {
        seen[key] = {
          index: [i],
          count: 1
        }
      }
      else {
        seen[key].index.push(i);
        seen[key].count++;
      }
    }
  }

  var out = [];
  Object.keys(seen).forEach(function (key) {
    var foo = seen[key];
    if (foo.count < dimensions) {
      out.push(foo.index[0]);
    }
  });

  return out.filter(function (value, index, self) {
    return index === self.indexOf(value);
  }).sort(function (a, b) {
    return a < b;
  });
}

module.exports = findStartingIndexes;
