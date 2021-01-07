'use strict';

const path = require('path');
const open = require('open');
const openIndexInBrowser = process.env.OPEN_IN_BROWSER;

function maybeOpenInBrowser(dir,done,file) {
  if (openIndexInBrowser) {
    const indexHtml = path.resolve(dir.cwd, file ? file : 'app/index.html');
    open(indexHtml).then(function () {
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
