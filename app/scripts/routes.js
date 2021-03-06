// @license Copyright David Xu, 2016
'use strict';
import page from 'page';

window.addEventListener('WebComponentsReady', function () {
  const app = Polymer.dom(document).querySelector('#app');

  app.baseUrl = '/';
  if (window.location.port === '') {  // if production
    // Uncomment app.baseURL below and
    // set app.baseURL to '/your-pathname/' if running from folder in production
    app.baseUrl = '/PolyTeX/';
  }

  // Removes end / from app.baseUrl which page.base requires for production
  if (window.location.port === '') {  // if production
    page.base(app.baseUrl.replace(/\/$/, ''));
  }

  page(app.baseUrl, () => {
    app.route = 'editor';
  });

  page('/', () => {
    app.route = 'editor';
  });

  page('/:fileId', ctx => {
    app.fileId = ctx.params.fileId;
    console.log(`Routing to open file: ${app.fileId}`);
  });

  page.start({
    hashbang: true
  });
});
