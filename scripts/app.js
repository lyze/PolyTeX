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

  app.baseUrl = '/';
  if (window.location.port === '') {
    // if production
    // Uncomment app.baseURL below and
    // set app.baseURL to '/your-pathname/' if running from folder in production
    app.baseUrl = '/PolyTeX/';
  }

  app.displayInstalledToast = function () {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      Polymer.dom(document).querySelector('#caching-complete').show();
    }
  };

  // Listen for template bound event to know when bindings have resolved and
  // content has been stamped to the page
  app.addEventListener('dom-change', function () {});

  app.filename = 'PolyTeX';
  app.isCompiling = false;
  app.codeMirrorOptions = {
    mode: 'stex',
    lineWrapping: true,
    lineNumbers: true
  };

  window.addEventListener('WebComponentsReady', function () {
    var editor = Polymer.dom(document).querySelector('#editor');
    var generatePreviewButton = Polymer.dom(document).querySelector('#generatePreviewButton');
    var compileProgress = Polymer.dom(document).querySelector('#compileProgress');
    var previewIFrame = Polymer.dom(document).querySelector('#previewIFrame');
    var preview = Polymer.dom(document).querySelector('#preview');
    var compileProblemToast = Polymer.dom(document).querySelector('#compileProblemToast');
    var compileLog = Polymer.dom(document).querySelector('#compileLog');
    var compileLogTextArea = Polymer.dom(document).querySelector('#compileLogTextArea');

    compileLog.fitInto = preview;

    app.showLog = function (e) {
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
      var outputListener = function outputListener(msg) {
        // console.log(msg);
        // Is this actually performant?
        if (msg !== undefined && msg !== null) {
          compileLogTextArea.value += msg + '\n';
        }
        // workaround for PDFTeX not using promises correctly
        var errorRE = /Fatal error occurred, no output PDF file produced!$/;
        if (errorRE.test(msg)) {
          var endTime = new Date();
          console.error(msg);
          app.compilationError = msg;
          compileProblemToast.open();
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
        compileProblemToast.open();
        app.isCompiling = false;
        app.compileStatus = 'error';
      });
    });

    var drawerPanel = Polymer.dom(document).querySelector('#drawerPanel');
    document.addEventListener('keydown', function (e) {
      if (e.keyCode == 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        drawerPanel.closeDrawer();
        saveAction();
      }
    });

    // used by #helloWorldItem
    app.doHelloWorld = function () {
      if (editor.getValue() && !confirm('Do you really want to discard your changes?')) {
        return;
      }
      editor.setValue('\\documentclass{article}\n\n\\begin{document}\nHello, world!\n\\end{document}');
      drawerPanel.closeDrawer();
    };

    // 707726290441-2t740vcema93b7jad2acqiku87qe25s6.apps.googleusercontent.com
    // var authProblemToast = Polymer.dom(document).querySelector('#authProblemToast')
    // gapi.load('client', () => {
    //   gapi.client.load('drive', 'v3', () => {
    //     gapi.client.load('realtime', 'v2', () => {
    //       gapi.auth.authorize({
    //         client_id: CLIENT_ID,
    //         scope: SCOPES,
    //         immediate: true
    //       }, response => {
    //         if (response.error) {
    //           console.debug('Google API not authorized.');
    //         } else {
    //           start();
    //         }
    //       });
    //     });
    //   });
    // });

    app.start = function () {
      gapi.client.load('drive', 'v3', function () {
        gapi.client.load('realtime', 'v2', function () {
          go();
        });
      });
    };
    var go = function go() {
      var insertHash = {
        'resource': {
          mimeType: 'application/vnd.google-apps.drive-sdk',
          title: app.filename
        }
      };
      gapi.client.drive.files.insert(insertHash).execute(function (createResponse) {
        // TODO: id
        console.log('hi');
        console.dir(gapi);
        gapi.client.drive.realtime.load(createResponse.id, function (doc) {
          wire(doc);
        });
      });
    };

    var wire = function wire(doc) {
      var doc = gapi.client.drive.realtime.newInMemoryDocument();
      var model = doc.getModel();
      var collaborativeString = model.createString();
      model.getRoot().set('PolyTeX_data', collaborativeString);
      var codeMirror = editor.codeMirror;
      var codeMirrorDoc = codeMirror.getDoc();
      collaborativeString.addEventListener(gapi.client.drive.realtime.EventType.TEXT_INSERTED, function (e) {
        var pos = codeMirrorDoc.posFromIndex(e.index);
        // inserts if you call with only one position argument
        doc.replaceRange(e.text, pos);
      });
      collaborativeString.addEventListener(gapi.client.drive.realtime.EventType.TEXT_DELETED, function (e) {
        var start = codeMirrorDoc.posFromIndex(e.index);
        var end = codeMirrorDoc.posFromIndex(e.index + e.text.length);
        doc.replaceRange('', start, end);
      });
      codeMirror.on('change', function (_, e) {
        model.beginCompoundOperation();
        for (var line = e.from.line; line < e.to.line; line++) {
          var start = codeMirrorDoc.indexFromPos({ line: line, ch: from.ch });
          var end = codeMirrorDoc.indexFromPos({ line: line, ch: to.ch });
          collaborativeString.removeRange(start, end);
          collaborativeString.insertString(start, e.text[line - e.from.line]);
        }
        model.endCompoundOperation();
      });
    };
  });
})(document);
//# sourceMappingURL=app.js.map