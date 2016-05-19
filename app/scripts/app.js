/* global Polymer */
// Copyright David Xu, 2016
import CompilationService from './compilationservice';


((document) => {
  'use strict';
  const compilationService = new CompilationService();

  var app = document.querySelector('#app');

  app.a11yTarget = document.body;

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

  app.filename = 'untitled.tex';
  app.isCompiling = false;
  app.codeMirrorOptions = {
    mode: 'stex',
    lineWrapping: true,
    lineNumbers: true
  };

  // Seems like hidden$=[[!undefined]] evaluates to hidden=false somehow
  app.fileId = null;

  // app properties written: webViewLink, fileId
  app.endDriveIntegration = () => {
    app.webViewLink = undefined;
    app.fileId = null;
  };

  window.addEventListener('WebComponentsReady', () => {
    var filenameTextArea = Polymer.dom(document).querySelector('#filenameTextArea');

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
    app.toggleCompileLog = _ => {
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
      compileLog.refit();
      var outputListener = msg => {
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
          app.isCompiling = false;
          app.compileStatus = 'error';
        });
    });

    var drawerPanel = Polymer.dom(document).querySelector('#drawerPanel');
    app.doSaveItemAction = e => {
      drawerPanel.closeDrawer();
      app.doSave(e);
    };

    // used by #helloWorldItem
    app.doHelloWorld = () => {
      if (editor.getValue() && !confirm('Do you really want to discard your changes?')) {
        return;
      }
      editor.setValue('\\documentclass{article}\n\n\\begin{document}\nHello, world!\n\\end{document}');
      drawerPanel.closeDrawer();
    };

    var notifySaved = (name, opt_isAutosave) => {
      if (opt_isAutosave) {
        app.savedMessage = 'Saved ' + name + ' at ' + new Date();
      } else {
        app.savedMessage = 'Saved ' + name + ' at ' + new Date();
      }
    };

    app.doSave = e => {
      editor.save().then(_ => notifySaved(editor.name),
                         r => app.apiErrorMessage = r.error.message);
    };

    editor.addEventListener('cloud-ready', _ => {
      editor.startDriveIntegration();
    });

    // app properties read: fileId
    // app properties written: fileId, webViewLink, doSave
  }); // WebComponentsReady

})(document);
