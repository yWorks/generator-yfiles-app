var path = require("path");
var fs = require('fs')

module.exports = {
  joinArrays: function (a, b) {
    var result = a.slice(0);
    b.forEach(function (element) {
      result.indexOf(element) >= 0 || result.push(element);
    });
    return result;
  },

  flattenTree: function (tree, root) {
    var result = [], queue = [root];
    while (queue.length > 0) {
      var node = queue.shift();
      result.indexOf(node) >= 0 || result.push(node);
      queue = queue.concat(tree[node]);
    }

    return result.sort();
  },

  removeChildren: function (array, tree) {
    function worker(node) {
      var children = tree[node];
      array = array.filter(function (element) {
        return children.indexOf(element) < 0;
      });
      children.forEach(function (child) {
        worker(child);
      });
    }

    for (var i = 0; i < array.length; i++) {
      worker(array[i]);
    }

    return array;
  },

  insertChildren: function (array, tree) {
    for (var i = 0; i < array.length; i++) {
      var key = array[i];
        array = array.concat(tree[key]);
    }
    return array.filter(function (node, index, array) {
      return array.lastIndexOf(node) === index;
    });
  },

  unixPath: function (p) {
    return path.normalize(p).replace("\\", "/") + "/";
  },

  camelCase: function (name) {
    return name.trim().replace(/\s+(\w)/g, function (_, letter) {
      return letter.toUpperCase();
    });
  },

  isValidName: function (name) {
    return /[^a-zA-Z_$ ]/.test(name) ? "This is not a valid name, only [a-zA-Z_$ ] are allowed." : true;
  },

  parseLicense: function(path) {
    var global = {
      yfiles: {},
    };
    try {
      // wrap the file with a function
      var getModules = new Function("global", fs.readFileSync(path, 'utf8'));
      // and pass yfiles and lang to it
      getModules.call(global, global);
      return global.yfiles.license;
    } catch (e) {
      return null;
    }
  }
};
