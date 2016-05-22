/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.2.2+35df15ea
 */

(function(){"use strict";function t(t){return"function"==typeof t||"object"==typeof t&&null!==t}function e(t){return"function"==typeof t}function n(t){G=t}function r(t){Q=t}function o(){return function(){process.nextTick(a)}}function i(){return function(){B(a)}}function s(){var t=0,e=new X(a),n=document.createTextNode("");return e.observe(n,{characterData:!0}),function(){n.data=t=++t%2}}function u(){var t=new MessageChannel;return t.port1.onmessage=a,function(){t.port2.postMessage(0)}}function c(){return function(){setTimeout(a,1)}}function a(){for(var t=0;J>t;t+=2){var e=tt[t],n=tt[t+1];e(n),tt[t]=void 0,tt[t+1]=void 0}J=0}function f(){try{var t=require,e=t("vertx");return B=e.runOnLoop||e.runOnContext,i()}catch(n){return c()}}function l(t,e){var n=this,r=new this.constructor(p);void 0===r[rt]&&k(r);var o=n._state;if(o){var i=arguments[o-1];Q(function(){x(o,r,i,n._result)})}else E(n,r,t,e);return r}function h(t){var e=this;if(t&&"object"==typeof t&&t.constructor===e)return t;var n=new e(p);return g(n,t),n}function p(){}function _(){return new TypeError("You cannot resolve a promise with itself")}function d(){return new TypeError("A promises callback cannot return that same promise.")}function v(t){try{return t.then}catch(e){return ut.error=e,ut}}function y(t,e,n,r){try{t.call(e,n,r)}catch(o){return o}}function m(t,e,n){Q(function(t){var r=!1,o=y(n,e,function(n){r||(r=!0,e!==n?g(t,n):S(t,n))},function(e){r||(r=!0,j(t,e))},"Settle: "+(t._label||" unknown promise"));!r&&o&&(r=!0,j(t,o))},t)}function b(t,e){e._state===it?S(t,e._result):e._state===st?j(t,e._result):E(e,void 0,function(e){g(t,e)},function(e){j(t,e)})}function w(t,n,r){n.constructor===t.constructor&&r===et&&constructor.resolve===nt?b(t,n):r===ut?j(t,ut.error):void 0===r?S(t,n):e(r)?m(t,n,r):S(t,n)}function g(e,n){e===n?j(e,_()):t(n)?w(e,n,v(n)):S(e,n)}function A(t){t._onerror&&t._onerror(t._result),T(t)}function S(t,e){t._state===ot&&(t._result=e,t._state=it,0!==t._subscribers.length&&Q(T,t))}function j(t,e){t._state===ot&&(t._state=st,t._result=e,Q(A,t))}function E(t,e,n,r){var o=t._subscribers,i=o.length;t._onerror=null,o[i]=e,o[i+it]=n,o[i+st]=r,0===i&&t._state&&Q(T,t)}function T(t){var e=t._subscribers,n=t._state;if(0!==e.length){for(var r,o,i=t._result,s=0;s<e.length;s+=3)r=e[s],o=e[s+n],r?x(n,r,o,i):o(i);t._subscribers.length=0}}function M(){this.error=null}function P(t,e){try{return t(e)}catch(n){return ct.error=n,ct}}function x(t,n,r,o){var i,s,u,c,a=e(r);if(a){if(i=P(r,o),i===ct?(c=!0,s=i.error,i=null):u=!0,n===i)return void j(n,d())}else i=o,u=!0;n._state!==ot||(a&&u?g(n,i):c?j(n,s):t===it?S(n,i):t===st&&j(n,i))}function C(t,e){try{e(function(e){g(t,e)},function(e){j(t,e)})}catch(n){j(t,n)}}function O(){return at++}function k(t){t[rt]=at++,t._state=void 0,t._result=void 0,t._subscribers=[]}function Y(t){return new _t(this,t).promise}function q(t){var e=this;return new e(I(t)?function(n,r){for(var o=t.length,i=0;o>i;i++)e.resolve(t[i]).then(n,r)}:function(t,e){e(new TypeError("You must pass an array to race."))})}function F(t){var e=this,n=new e(p);return j(n,t),n}function D(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}function K(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}function L(t){this[rt]=O(),this._result=this._state=void 0,this._subscribers=[],p!==t&&("function"!=typeof t&&D(),this instanceof L?C(this,t):K())}function N(t,e){this._instanceConstructor=t,this.promise=new t(p),this.promise[rt]||k(this.promise),I(e)?(this._input=e,this.length=e.length,this._remaining=e.length,this._result=new Array(this.length),0===this.length?S(this.promise,this._result):(this.length=this.length||0,this._enumerate(),0===this._remaining&&S(this.promise,this._result))):j(this.promise,U())}function U(){return new Error("Array Methods must be provided an Array")}function W(){var t;if("undefined"!=typeof global)t=global;else if("undefined"!=typeof self)t=self;else try{t=Function("return this")()}catch(e){throw new Error("polyfill failed because global object is unavailable in this environment")}var n=t.Promise;(!n||"[object Promise]"!==Object.prototype.toString.call(n.resolve())||n.cast)&&(t.Promise=pt)}var z;z=Array.isArray?Array.isArray:function(t){return"[object Array]"===Object.prototype.toString.call(t)};var B,G,H,I=z,J=0,Q=function(t,e){tt[J]=t,tt[J+1]=e,J+=2,2===J&&(G?G(a):H())},R="undefined"!=typeof window?window:void 0,V=R||{},X=V.MutationObserver||V.WebKitMutationObserver,Z="undefined"==typeof self&&"undefined"!=typeof process&&"[object process]"==={}.toString.call(process),$="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel,tt=new Array(1e3);H=Z?o():X?s():$?u():void 0===R&&"function"==typeof require?f():c();var et=l,nt=h,rt=Math.random().toString(36).substring(16),ot=void 0,it=1,st=2,ut=new M,ct=new M,at=0,ft=Y,lt=q,ht=F,pt=L;L.all=ft,L.race=lt,L.resolve=nt,L.reject=ht,L._setScheduler=n,L._setAsap=r,L._asap=Q,L.prototype={constructor:L,then:et,"catch":function(t){return this.then(null,t)}};var _t=N;N.prototype._enumerate=function(){for(var t=this.length,e=this._input,n=0;this._state===ot&&t>n;n++)this._eachEntry(e[n],n)},N.prototype._eachEntry=function(t,e){var n=this._instanceConstructor,r=n.resolve;if(r===nt){var o=v(t);if(o===et&&t._state!==ot)this._settledAt(t._state,e,t._result);else if("function"!=typeof o)this._remaining--,this._result[e]=t;else if(n===pt){var i=new n(p);w(i,t,o),this._willSettleAt(i,e)}else this._willSettleAt(new n(function(e){e(t)}),e)}else this._willSettleAt(r(t),e)},N.prototype._settledAt=function(t,e,n){var r=this.promise;r._state===ot&&(this._remaining--,t===st?j(r,n):this._result[e]=n),0===this._remaining&&S(r,this._result)},N.prototype._willSettleAt=function(t,e){var n=this;E(t,void 0,function(t){n._settledAt(it,e,t)},function(t){n._settledAt(st,e,t)})};var dt=W,vt={Promise:pt,polyfill:dt};"function"==typeof define&&define.amd?define(function(){return vt}):"undefined"!=typeof module&&module.exports?module.exports=vt:"undefined"!=typeof this&&(this.ES6Promise=vt),dt()}).call(this);
var PDFTeX = function(opt_workerPath) {
  if (!opt_workerPath) {
    opt_workerPath = 'pdftex-worker.js';
  }
  var worker = new Worker(opt_workerPath);
  this.worker = worker;
  var self = this;
  var initialized = false;

  self.on_stdout = function(msg) {
    console.log(msg);
  }

  self.on_stderr = function(msg) {
    console.log(msg);
  }


  worker.onmessage = function(ev) {
    var data = JSON.parse(ev.data);
    var msg_id;

    if(!('command' in data))
      console.log("missing command!", data);
    switch(data['command']) {
      case 'ready':
        onready.done(true);
        break;
      case 'stdout':
      case 'stderr':
        self['on_'+data['command']](data['contents']);
        break;
      default:
        //console.debug('< received', data);
        msg_id = data['msg_id'];
        if(('msg_id' in data) && (msg_id in promises)) {
          promises[msg_id].done(data['result']);
        }
        else
          console.warn('Unknown worker message '+msg_id+'!');
    }
  }

  var onready = new promise.Promise();
  var promises = [];
  var chunkSize = undefined;

  var sendCommand = function(cmd) {
    var p = new promise.Promise();
    var msg_id = promises.push(p)-1;

    onready.then(function() {
      cmd['msg_id'] = msg_id;
      //console.debug('> sending', cmd);
      worker.postMessage(JSON.stringify(cmd));
    });

    return p;
  };

  var determineChunkSize = function() {
    var size = 1024;
    var max = undefined;
    var min = undefined;
    var delta = size;
    var success = true;
    var buf;

    while(Math.abs(delta) > 100) {
      if(success) {
        min = size;
        if(typeof(max) === 'undefined')
          delta = size;
        else
          delta = (max-size)/2;
      }
      else {
        max = size;
        if(typeof(min) === 'undefined')
          delta = -1*size/2;
        else
          delta = -1*(size-min)/2;
      }
      size += delta;

      success = true;
      try {
        buf = String.fromCharCode.apply(null, new Uint8Array(size));
        sendCommand({
          command: 'test',
          data: buf,
        });
      }
      catch(e) {
        success = false;
      }
    }

    return size;
  };


  var createCommand = function(command) {
    self[command] = function() {
      var args = [].concat.apply([], arguments);

      return sendCommand({
        'command':  command,
        'arguments': args,
      });
    }
  }
  createCommand('FS_createDataFile'); // parentPath, filename, data, canRead, canWrite
  createCommand('FS_readFile'); // filename
  createCommand('FS_unlink'); // filename
  createCommand('FS_createFolder'); // parent, name, canRead, canWrite
  createCommand('FS_createPath'); // parent, name, canRead, canWrite
  createCommand('FS_createLazyFile'); // parent, name, canRead, canWrite
  createCommand('FS_createLazyFilesFromList'); // parent, list, parent_url, canRead, canWrite
  createCommand('set_TOTAL_MEMORY'); // size

  var curry = function(obj, fn, args) {
    return function() {
      return obj[fn].apply(obj, args);
    }
  }

  self.compile = function(source_code) {
    var p = new promise.Promise();

    self.compileRaw(source_code).then(function(binary_pdf) {
      if(binary_pdf === false)
        return p.done(false);

      pdf_dataurl = 'data:application/pdf;charset=binary;base64,' + window.btoa(binary_pdf);

      return p.done(pdf_dataurl);
    });
    return p;
  }

  self.compileRaw = function(source_code) {
    if(typeof(chunkSize) === "undefined")
      chunkSize = determineChunkSize();

    var commands;
    if(initialized)
      commands = [
        curry(self, 'FS_unlink', ['/input.tex']),
      ];
    else
      commands = [
        curry(self, 'FS_createDataFile', ['/', 'input.tex', source_code, true, true]),
        curry(self, 'FS_createLazyFilesFromList', ['/', 'texlive.lst', './texlive', true, true]),
      ];

    var sendCompile = function() {
      initialized = true;
      return sendCommand({
        'command': 'run',
        'arguments': ['-interaction=nonstopmode', '-output-format', 'pdf', 'input.tex'],
//        'arguments': ['-debug-format', '-output-format', 'pdf', '&latex', 'input.tex'],
      });
    };

    var getPDF = function() {
      console.log(arguments);
      return self.FS_readFile('/input.pdf');
    }

    return promise.chain(commands)
      .then(sendCompile)
      .then(getPDF);
  };
};

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