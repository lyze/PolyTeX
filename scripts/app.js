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

babelHelpers.slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
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

var CLIENT_ID = '707726290441-2t740vcema93b7jad2acqiku87qe25s6.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/drive.install', 'https://www.googleapis.com/auth/drive.file'];

var AUTH_PARAMS = {
  client_id: CLIENT_ID,
  scope: SCOPES,
  immediate: true
};

var Auth = function () {
  function Auth(auth) {
    babelHelpers.classCallCheck(this, Auth);

    this.auth = auth;
  }

  babelHelpers.createClass(Auth, [{
    key: 'authorize',
    value: function authorize(callback) {
      this.auth.authorize(AUTH_PARAMS, callback);
    }
  }], [{
    key: '_authorize',
    value: function _authorize(auth, callback) {
      auth.authorize(AUTH_PARAMS, callback);
    }
  }]);
  return Auth;
}();

var Realtime = function () {
  function Realtime(realtimeApi, auth) {
    babelHelpers.classCallCheck(this, Realtime);

    this.api = realtimeApi;
    this.auth = auth;
  }

  babelHelpers.createClass(Realtime, [{
    key: 'load',
    value: function load(fileId, onLoaded, opt_initializerFn, opt_errorFn) {
      var _this = this;

      return this.api.load(fileId, onLoaded, opt_initializerFn, function (e) {

        if (e.type === _this.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
          console.log('Reauthorizing...');
          _this.auth.authorize(function (_) {
            console.log('Reauthorized.');
            _this.api.load(fileId, onLoaded, opt_initializerFn, function (e) {
              console.error('Failed to load realtime document for file ' + fileId + ' after attempting reauthorization.', e);
              opt_errorFn(e);
            });
          });
        } else {
          opt_errorFn(e);
        }
      });
    }
  }]);
  return Realtime;
}();;

// function sendGApiXhr(xhr, opt_data) {
//   xhr.setHeader('Authorization', 'Bearer
//   return sendXhr(xhr, opt_data).then(xhr => xhr.response, xhr => {
//     throw xhr.response;
//   });
// }

// function sendXhr(xhr, opt_data) {
//   return new Promise((resolve, reject) => {
//     xhr.send(opt_data);
//     xhr.onreadystatechange = () => {
//       if (xhr.readyState === XMLHttpRequest.DONE) {
//         if (xhr.status === 200) {
//           resolve(xhr);
//         } else {
//           reject(xhr);
//         }
//       };
//     };
//   });
// }

var Drive = function () {
  function Drive(drive, gapi) {
    babelHelpers.classCallCheck(this, Drive);

    this.drive = drive;
    this.gapi = gapi;
  }

  babelHelpers.createClass(Drive, [{
    key: 'createTeXFile',
    value: function createTeXFile(name, opt_overrideParams) {
      var opts = {
        name: name,
        mimeType: 'application/x-tex',
        useContentAsIndexableText: true
      };
      return this.drive.files.create(Object.assign(opts, opt_overrideParams));
    }
  }, {
    key: 'uploadTeXFile',
    value: function uploadTeXFile(fileId, content, opt_overrideParams) {
      return this.gapi.client.request({
        path: '/upload/drive/v3/files/' + fileId,
        method: 'PATCH',
        params: Object.assign({
          uploadType: 'media',
          useContentAsIndexableText: true
        }, opt_overrideParams),
        headers: {
          'Content-Type': 'application/x-tex'
        },
        body: content
      });

      // var xhr = new XMLHttpRequest();
      // xhr.open('PATCH', `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&useContentAsIndexableText=true`);
      // xhr.responseType = 'json';
      // return sendGApiXhr(xhr, content);
      // TODO
    }
  }]);
  return Drive;
}();;

function newDriveAndRealtimePromise(driveApiLoader, realtimeApiLoader) {
  var realtimePromise;
  if (realtimeApiLoader.libraryLoaded) {
    realtimePromise = Promise.resolve(realtimeApiLoader.api);
  } else {
    realtimePromise = new Promise(function (resolve, reject) {
      realtimeApiLoader.addEventListener('api-load', function (e) {
        return resolve(e.target.api);
      });
      realtimeApiLoader.addEventListener('library-error-message-changed', function (e) {
        return reject(e.detail.value);
      });
    });
  }

  var drivePromise = new Promise(function (resolve, reject) {
    driveApiLoader.addEventListener('google-api-load', function (e) {
      var auth = e.target.auth;
      Auth._authorize(auth, function (_) {
        return resolve(e.target.api);
      });
    });

    driveApiLoader.addEventListener('google-api-load-error', function (e) {
      return reject(e.detail.value);
    });
  });

  return Promise.all([drivePromise, realtimePromise]).then(function (_ref) {
    var _ref2 = babelHelpers.slicedToArray(_ref, 2);

    var driveApi = _ref2[0];
    var realtimeApi = _ref2[1];

    var realtime = new Realtime(realtimeApi, new Auth(window.gapi.auth));
    var drive = new Drive(driveApi, window.gapi);
    return [drive, realtime];
  });
}

(function (document) {
  'use strict';

  var compilationService = new CompilationService();

  var app = document.querySelector('#app');

  app.a11yTarget = document.body;

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

  // Seems like hidden$=[[!undefined]] evaluates to hidden=false somehow
  app.fileId = null;

  // app properties written: webViewLink, fileId
  app.endDriveIntegration = function () {
    app.webViewLink = undefined;
    app.fileId = null;
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

    var apiErrorToast = Polymer.dom(document).querySelector('#apiErrorToast');

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
    app.doSaveItemAction = function (e) {
      drawerPanel.closeDrawer();
      app.doSave(e);
    };

    // used by #helloWorldItem
    app.doHelloWorld = function () {
      if (editor.getValue() && !confirm('Do you really want to discard your changes?')) {
        return;
      }
      editor.setValue('\\documentclass{article}\n\n\\begin{document}\nHello, world!\n\\end{document}');
      drawerPanel.closeDrawer();
    };

    var notifySaved = function notifySaved(name, opt_isAutosave) {
      if (opt_isAutosave) {
        app.savedMessage = 'Saved ' + name + ' at ' + new Date();
      } else {
        app.savedMessage = 'Saved ' + name + ' at ' + new Date();
      }
    };

    app.viewInDrive = function () {
      return window.open(app.webViewLink);
    };

    // app properties read: fileId
    // app properties written: fileId, webViewLink, doSave
    app.startDriveIntegration = function () {
      console.log('Loading Google APIs...');
      var realtimeApiLoader = Polymer.dom(document).querySelector('#realtimeApiLoader');
      var driveApiLoader = Polymer.dom(document).querySelector('#driveApiLoader');

      newDriveAndRealtimePromise(driveApiLoader, realtimeApiLoader).then(function (_ref) {
        var _ref2 = babelHelpers.slicedToArray(_ref, 2);

        var drive = _ref2[0];
        var realtime = _ref2[1];

        console.log('Google APIs loaded.');

        app.doSave = function (e) {
          // use the realtime model data instead?
          drive.uploadTeXFile(app.fileId, editor.getValue()).then(function (response) {
            console.log('Saved.', response);
            notifySaved(response.result.name);
          }, function (response) {
            console.error('Cannot save file.', response);
            app.apiErrorMessage = response.error.message;
          });
        };

        var initializeModel = function initializeModel(model) {
          var string = model.createString();
          string.setText('');
          model.getRoot().set('PolyTeX-data', string);
        };

        var wire = function wire(doc) {
          var model = doc.getModel();
          var collaborativeString = model.getRoot().get('PolyTeX-data');
          var codeMirror = editor.codeMirror;
          var codeMirrorDoc = codeMirror.getDoc();
          collaborativeString.addEventListener(realtime.api.EventType.TEXT_INSERTED, function (e) {
            var pos = codeMirrorDoc.posFromIndex(e.index);
            // performs an insertion if you call it with only one position argument
            doc.replaceRange(e.text, pos);
          });
          collaborativeString.addEventListener(realtime.api.EventType.TEXT_DELETED, function (e) {
            var start = codeMirrorDoc.posFromIndex(e.index);
            var end = codeMirrorDoc.posFromIndex(e.index + e.text.length);
            doc.replaceRange('', start, end);
          });
          codeMirror.on('change', function (_, e) {
            model.beginCompoundOperation();
            for (var line = e.from.line; line < e.to.line; line++) {
              var start = codeMirrorDoc.indexFromPos({ line: line, ch: e.from.ch });
              var end = codeMirrorDoc.indexFromPos({ line: line, ch: e.to.ch });
              collaborativeString.removeRange(start, end);
              collaborativeString.insertString(start, e.text[line - e.from.line]);
            }
            model.endCompoundOperation();
          });
        };

        drive.createTeXFile(app.filename, { fields: 'id,name,webViewLink' }).then(function (response) {
          console.log('Created Google Drive file: ' + response.result.name, response);
          app.fileId = response.result.id;
          app.webViewLink = response.result.webViewLink;
          // start the realtime functionality
          realtime.load(response.result.id, wire, initializeModel, function (e) {
            return app.apiErrorMessage = e.toString();
          });
        });
      });
    };
  }); // WebComponentsReady
})(document);