import CompilationService from './compilationservice';
((document) => {
  'use strict';
  const compilationService = new CompilationService();

  var app = document.querySelector('#app');

  app.baseUrl = '/';
  if (window.location.port === '') {  // if production
    // Uncomment app.baseURL below and
    // set app.baseURL to '/your-pathname/' if running from folder in production
    app.baseUrl = '/PolyTeX/';
  }

  app.displayInstalledToast = () => {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      Polymer.dom(document).querySelector('#caching-complete').show();
    }
  };

  // Listen for template bound event to know when bindings have resolved and
  // content has been stamped to the page
  app.addEventListener('dom-change', () => {
  });

  app.filename = 'PolyTeX';
  app.isCompiling = false;
  app.codeMirrorOptions = {
    mode: 'stex',
    lineWrapping: true,
    lineNumbers: true
  };

  window.addEventListener('WebComponentsReady', () => {
    var editor = Polymer.dom(document).querySelector('#editor');
    var generatePreviewButton = Polymer.dom(document).querySelector('#generatePreviewButton');
    var compileProgress = Polymer.dom(document).querySelector('#compileProgress');
    var previewIFrame = Polymer.dom(document).querySelector('#previewIFrame');
    var preview = Polymer.dom(document).querySelector('#preview');
    var compileProblemToast = Polymer.dom(document).querySelector('#compileProblemToast');
    var compileLog = Polymer.dom(document).querySelector('#compileLog');
    var compileLogTextArea = Polymer.dom(document).querySelector('#compileLogTextArea');

    compileLog.fitInto = preview;

    app.showLog = e => {
      compileLog.toggle();
    };

    generatePreviewButton.addEventListener('click', e => {
      var startTime = new Date();
      app.isCompiling = true;
      if (app.compileStatus === 'in-progress') {
        return;
      }
      app.compileStatus = 'in-progress';
      console.log('Started compilation at ' + startTime);

      compileLogTextArea.value = '';
      var outputListener = msg => {
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

      compilationService.compile(editor.getValue(), outputListener)
        .then(pdfDataUrl => {
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
        }).catch(e => {
          // TODO: refactor this out
          console.error(e);
          app.compilationError = e.message;
          compileProblemToast.open();
          app.isCompiling = false;
          app.compileStatus = 'error';
        });
    });

    var drawerPanel = Polymer.dom(document).querySelector('#drawerPanel');
    document.addEventListener('keydown', e => {
      if (e.keyCode == 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        drawerPanel.closeDrawer();
        saveAction();
      }
    });

    // used by #helloWorldItem
    app.doHelloWorld = () => {
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

    app.start = () => {
      gapi.client.load('drive', 'v3', () => {
        gapi.client.load('realtime', 'v2', () => {
          go();
        });
      });
    };
    var go = () => {
      var insertHash = {
        'resource': {
          mimeType: 'application/vnd.google-apps.drive-sdk',
          title: app.filename
        }
      };
      gapi.client.drive.files.insert(insertHash).execute(createResponse => {
        // TODO: id
        console.log('hi');
        console.dir(gapi);
        gapi.client.drive.realtime.load(createResponse.id, doc => {
          wire(doc);
        });
      });
    };

    var wire = doc => {
      var doc = gapi.client.drive.realtime.newInMemoryDocument();
      var model = doc.getModel();
      var collaborativeString = model.createString();
      model.getRoot().set('PolyTeX_data', collaborativeString);
      var codeMirror = editor.codeMirror;
      var codeMirrorDoc = codeMirror.getDoc();
      collaborativeString.addEventListener(gapi.client.drive.realtime.EventType.TEXT_INSERTED, e => {
        var pos = codeMirrorDoc.posFromIndex(e.index);
        // inserts if you call with only one position argument
        doc.replaceRange(e.text, pos);
      });
      collaborativeString.addEventListener(gapi.client.drive.realtime.EventType.TEXT_DELETED, e => {
        var start = codeMirrorDoc.posFromIndex(e.index);
        var end = codeMirrorDoc.posFromIndex(e.index + e.text.length);
        doc.replaceRange('', start, end);
      });
      codeMirror.on('change', (_, e) => {
        model.beginCompoundOperation();
        for (let line = e.from.line; line < e.to.line; line++) {
          var start = codeMirrorDoc.indexFromPos({line: line, ch: from.ch});
          var end = codeMirrorDoc.indexFromPos({line: line, ch: to.ch});
          collaborativeString.removeRange(start, end);
          collaborativeString.insertString(start, e.text[line - e.from.line]);
        }
        model.endCompoundOperation();
      });
    };



  });

})(document);
