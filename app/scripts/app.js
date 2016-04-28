import CompilationService from './compilationservice';
((document) => {
  'use strict';
  const compilationService = new CompilationService();

  var app = document.querySelector('#app');

  app.baseUrl = '/';
  if (window.location.port === '') {  // if production
    // Uncomment app.baseURL below and
    // set app.baseURL to '/your-pathname/' if running from folder in production
    // app.baseUrl = '/polymer-starter-kit/';
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

  app.filename = 'Untitled';
  app.isCompiling = false;
  app.codeMirrorOptions = {
    mode: 'stex',
    lineWrapping: true,
    lineNumbers: true
  };

  window.addEventListener('WebComponentsReady', () => {
    var generatePreviewButton = Polymer.dom(document).querySelector('#generatePreviewButton');
    var compileProgress = Polymer.dom(document).querySelector('#compileProgress');
    var editor = Polymer.dom(document).querySelector('#editor');
    var previewIFrame = Polymer.dom(document).querySelector('#previewIFrame');
    generatePreviewButton.addEventListener('click', e => {
      var startTime = new Date();
      console.log('Started compilation at ' + startTime);
      app.isCompiling = true;

      // workaround for PDFTeX not using promises correctly
      var outputListener = msg => {
        console.log(msg);
        var errorRE = /Fatal error occurred, no output PDF file produced!$/;
        if (errorRE.test(msg)) {
          var endTime = new Date();
          console.error(msg);
          app.compilationError = msg;
          app.isCompiling = false;
          console.log('Finished compilation at ' + endTime);
          console.log('Execution time: ' + (endTime - startTime) + 'ms');
        }
      };

      compilationService.compile(editor.getValue(), outputListener)
        .then(pdfDataUrl => {
          // workaround for PDFTeX not using promises correctly
          console.log(pdfDataUrl);
          if (!pdfDataUrl) {
            throw new Error('No PDF data URL');
          }
          var endTime = new Date();
          app.isCompiling = false;

          console.log('Finished compilation at ' + endTime);
          console.log('Execution time: ' + (endTime - startTime) + 'ms');
          if (pdfDataUrl) {
            previewIFrame.setAttribute('src', pdfDataUrl);
          } else {
            previewIFrame.setAttribute('src', 'about:blank');
          }
          compileProgress.style.display = 'none';
        }).catch(e => {
          console.error(e);
          app.compilationError = e.message;
          app.isCompiling = false;
        });
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
    if (editor.getValue() && !confirm("Do you really want to discard your changes?")) {
      return;
    }
    editor.setValue('\\documentclass{article}\n\n\\begin{document}\nHello, world!\n\\end{document}');
    drawerPanel.closeDrawer();
  };

})(document);
