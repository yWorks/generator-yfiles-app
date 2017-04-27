'use strict';

var path = require('path');
var opn = require('opn');
var openIndexInBrowser = !!process.env.OPEN_IN_BROWSER;

function maybeOpenInBrowser(dir,done,file) {
  if (openIndexInBrowser) {
    var indexHtml = path.resolve(dir,file?file:'app/index.html');
    opn(indexHtml).then(function () {
      done();
    }, function (err) {
      console.log(err);
      done();
    })
  } else {
    done();
  }
}

module.exports = {
  maybeOpenInBrowser: maybeOpenInBrowser
};
