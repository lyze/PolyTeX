var babelHelpers = {};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

babelHelpers;

/* global PDFTeX */

// Workaround for texlivejs not using a promise dependency
var WrappedPromise = function WrappedPromise() {
  var _this = this;

  this.promise = new Promise(function (resolve, reject) {
    _this.resolve = resolve;
    _this.reject = reject;
  });
};
WrappedPromise.prototype.done = function (v) {
  this.resolve(v);
};
WrappedPromise.prototype.then = function () {
  return this.promise.then.apply(this.promise, arguments);
};

var chain = function chain(funcs, args) {
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
window.promise = { Promise: WrappedPromise, chain: chain };

var CompilationService = function () {
  function CompilationService() {
    babelHelpers.classCallCheck(this, CompilationService);

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


  babelHelpers.createClass(CompilationService, [{
    key: 'compile',
    value: function compile(source, outputAppender) {
      var _this2 = this;

      this.pdftex.worker.terminate();
      this.pdftex = new PDFTeX('bower_components/texlivejs/pdftex-worker.js');
      var p = this.pdftex.set_TOTAL_MEMORY(80 * 1024 * 1024);
      return p.then(function () {
        _this2.pdftex.on_stdout = outputAppender;
        _this2.pdftex.on_stderr = outputAppender;
        return _this2.pdftex.compile(source);
      });
    }
  }]);
  return CompilationService;
}();

(function (document) {
  'use strict';

  var compilationService = new CompilationService();

  var app = document.querySelector('#app');

  app.a11yTarget = document.body;

  app.displayInstalledToast = function () {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      Polymer.dom(document).querySelector('#caching-complete').show();
    }
  };

  app.endCloudIntegration = function () {
    // no-op; actual implementation defined later when app is ready.
  };

  app.isConnectCloudItemDisabled = function (cloudStatus) {
    return ['loading', 'unavailable', 'authorizing'].includes(cloudStatus);
  };

  app.isConnectCloudItemHidden = function (cloudStatus) {
    return !['loading', 'unavailable', 'unauthorized', 'authorizing'].includes(cloudStatus);
  };

  app.isCloudFileConnected = function (cloudStatus) {
    return ['loaded', 'dirty', 'saving', 'saved'].includes(cloudStatus);
  };

  var editorHasCloudFile = function editorHasCloudFile() {
    return ['loaded', 'dirty', 'saving', 'saved'].includes(app.cloudStatus);
  };

  // Listen for template bound event to know when bindings have resolved and
  // content has been stamped to the page
  app.addEventListener('dom-change', function () {});

  app.filename = 'untitled.tex';
  app.isCompiling = false;

  app.codeMirrorOptions = {
    mode: 'stex',
    lineWrapping: true,
    lineNumbers: true
  };

  window.addEventListener('WebComponentsReady', function () {
    var filenameInput = Polymer.dom(document).querySelector('#filenameInput');

    var editor = Polymer.dom(document).querySelector('#editor');
    var generatePreviewButton = Polymer.dom(document).querySelector('#generatePreviewButton');
    var compileProgress = Polymer.dom(document).querySelector('#compileProgress');
    var previewIFrame = Polymer.dom(document).querySelector('#previewIFrame');
    var preview = Polymer.dom(document).querySelector('#preview');
    var compileProblemToast = Polymer.dom(document).querySelector('#compileProblemToast');
    var compileLog = Polymer.dom(document).querySelector('#compileLog');
    var compileLogTextArea = Polymer.dom(document).querySelector('#compileLogTextArea');

    var apiErrorToast = Polymer.dom(document).querySelector('#apiErrorToast');

    var googleSignIn = Polymer.dom(document).querySelector('#googleSignIn');

    app.updateFilename = function (e, detail) {
      filenameInput.input.blur();
      app.filename = filenameInput.value;
    };

    compileLog.fitInto = preview;
    app.toggleCompileLog = function (_) {
      compileLog.toggle();
    };

    generatePreviewButton.addEventListener('click', function (e) {
      var startTime = new Date();
      app.isCompiling = true;
      if (app.compileStatus === 'in-progress') {
        return;
      }
      app.compileStatus = 'in-progress';
      console.log('Started compilation at ' + startTime);

      compileLogTextArea.value = '';
      compileLog.refit();
      var outputListener = function outputListener(msg) {
        // console.log(msg);
        // Is this actually performant?
        if (msg !== undefined && msg !== null) {
          compileLogTextArea.value += msg + '\n';
          compileLog.refit();
        }
        // workaround for PDFTeX not using promises correctly
        var errorRE = /Fatal error occurred, no output PDF file produced!$/;
        if (errorRE.test(msg)) {
          var endTime = new Date();
          console.error(msg);
          app.compilationError = msg;
          app.isCompiling = false;
          app.compileStatus = 'error';
          console.log('Finished compilation at ' + endTime);
          console.log('Execution time: ' + (endTime - startTime) + 'ms');
        }
      };

      compilationService.compile(editor.getValue(), outputListener).then(function (pdfDataUrl) {
        // workaround for PDFTeX not using promises correctly
        console.log(pdfDataUrl);
        if (!pdfDataUrl) {
          app.compileStatus = 'error';
          throw new Error('No PDF data URL');
        }
        var endTime = new Date();
        app.isCompiling = false;

        console.log('Finished compilation at ' + endTime);
        console.log('Execution time: ' + (endTime - startTime) + 'ms');
        if (pdfDataUrl) {
          previewIFrame.setAttribute('src', pdfDataUrl);
          app.compileStatus = 'ok';
        } else {
          previewIFrame.setAttribute('src', 'about:blank');
          app.compileStatus = 'error';
        }
        compileProgress.style.display = 'none';
      }).catch(function (e) {
        // TODO: refactor this out
        console.error(e);
        app.compilationError = e.message;
        app.isCompiling = false;
        app.compileStatus = 'error';
      });
    });

    var drawerPanel = Polymer.dom(document).querySelector('#drawerPanel');
    app.doSaveItemAction = function () {
      if (editorHasCloudFile()) {
        drawerPanel.closeDrawer();
        app.doManualSave.apply(app, arguments);
      }
    };

    // used by #helloWorldItem
    app.doHelloWorld = function () {
      if (editor.getValue() && !confirm('Do you really want to discard your changes?')) {
        return;
      }
      editor.setValue('\\documentclass{article}\n\n\\begin{document}\nHello, world!\n\\end{document}');
      drawerPanel.closeDrawer();
    };

    app.connectCloud = function () {
      drawerPanel.closeDrawer();
      editor.connectCloud().catch(function (_) {
        // no-op
        // app.apiErrorMessage = 'Failed to connect to Google Drive.';
      });
    };

    app.disconnectCloud = function () {
      drawerPanel.closeDrawer();
      editor.endCloudIntegration();
    };

    app.startCloudIntegration = function () {
      editor.startCloudIntegration();
    };

    app.endCloudIntegration = function () {
      app.webViewLink = null;
      app.lastCloudModificationTime = null;
      editor.endCloudIntegration();
    };

    editor.addEventListener('cloud-ready', function () {});

    editor.addEventListener('cloud-file-loaded', function (e) {
      var _e$detail$result = e.detail.result;
      var id = _e$detail$result.id;
      var name = _e$detail$result.name;
      var webViewLink = _e$detail$result.webViewLink;
      var createdTime = _e$detail$result.createdTime;
      var modifiedTime = _e$detail$result.modifiedTime;

      if (createdTime) {
        app.savedMessage = 'Created ' + name + ' at ' + new Date(createdTime);
      }
      if (modifiedTime) {
        app.lastCloudModificationTime = new Date(modifiedTime);
      }

      app.doManualSave = function (e, detail) {
        editor.save().then(function (_) {
          return app.savedMessage = 'Saved ' + name + ' at ' + new Date();
        }, function (r) {
          return app.apiErrorMessage = r.error.message;
        });
        // workaround for e.preventDefault() for ctrl+s
        detail.keyboardEvent.preventDefault();
      };
    });

    app.maybeStartCloudIntegration = function () {
      // TODO: drive integration from google signin
    };
  }); // WebComponentsReady
})(document);
//# sourceMappingURL=app.js.map