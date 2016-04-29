/* global PDFTeX */

// Workaround for texlivejs not using a promise dependency
var WrappedPromise = function () {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}
WrappedPromise.prototype.done = function (v) {
  this.resolve(v);
};
WrappedPromise.prototype.then = function () {
  return this.promise.then.apply(this.promise, arguments);
};

var chain = function (funcs, args) {
  var p = new WrappedPromise();
  if (funcs.length === 0) {
    p.done(args);
  } else {
    funcs[0].apply(null, args).then(function () {
      funcs.splice(0, 1);
      chain(funcs, arguments).then(function () {
        p.done.apply(p, arguments);
      });
    });
  }
  return p;
};
window.promise = {Promise: WrappedPromise, chain: chain};

export default class CompilationService {
  constructor() {
    this.pdftex = new PDFTeX('bower_components/texlivejs/pdftex-worker.js');
  }

  /**
   * Compiles the specified LaTeX source.
   *
   * @param {string} source the source code
   * @param {outputAppender} callback a function (called potentially multiple
   * times) that handles a line of compilation output.
   * @return a promise that resolves to a PDF data URL
   */
  compile(source, outputAppender) {
    this.pdftex.worker.terminate();
    this.pdftex = new PDFTeX('bower_components/texlivejs/pdftex-worker.js');
    var p = this.pdftex.set_TOTAL_MEMORY(80 * 1024 * 1024);
    return p.then(() => {
      this.pdftex.on_stdout = outputAppender;
      this.pdftex.on_stderr = outputAppender;
      return this.pdftex.compile(source);
    });
  }
}
