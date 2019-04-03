const path = require("path");
const fs = require('fs')

module.exports = {
  joinArrays: function (a, b) {
    const result = a.slice(0);
    b.forEach(function (element) {
      result.indexOf(element) >= 0 || result.push(element);
    });
    return result;
  },

  flattenTree: function (tree, root) {
    const result = [];
    let queue = [root];
    while (queue.length > 0) {
      const node = queue.shift();
      result.indexOf(node) >= 0 || result.push(node);
      queue = queue.concat(tree[node]);
    }

    return result.sort();
  },

  removeChildren: function (array, tree) {
    function worker(node) {
      const children = tree[node];
      array = array.filter(function (element) {
        return children.indexOf(element) < 0;
      });
      children.forEach(function (child) {
        worker(child);
      });
    }

    for (let i = 0; i < array.length; i++) {
      worker(array[i]);
    }

    return array;
  },

  insertChildren: function (array, tree) {
    for (let i = 0; i < array.length; i++) {
      const key = array[i];
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

  toValidName: function (name) {
    name = name.replace(/^[^a-zA-Z_$]/,'_')
    name = name.replace(/[^0-9a-zA-Z_$]/g,'_')
    return name
  },

  isValidName: function (name) {
    return !/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name) ? '"'+ name + "\" is not a valid name - please make sure the name can be used as a JavaScript identifier." : true;
  },

  parseLicense: function(path) {
    const global = {
      yfiles: {},
    };
    try {
      return JSON.parse(fs.readFileSync(path, 'utf8'))
    } catch (e) {
      return null;
    }
  }
};
