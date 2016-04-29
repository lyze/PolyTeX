window.addEventListener('WebComponentsReady', function() {

    // We use Page.js for routing. This is a Micro
    // client-side router inspired by the Express router
    // More info: https://visionmedia.github.io/page.js/

    // Removes end / from app.baseUrl which page.base requires for production
    if (window.location.port === '') {  // if production
      page.base(app.baseUrl.replace(/\/$/, ''));
    }

    function closeDrawer(ctx, next) {
      app.$.drawerPanel.closeDrawer();
      next();
    }

    // Routes
    page('*', closeDrawer, (ctx, next) => {
      next();
    });

    page('/', () => {
      app.route = 'editor';
    });

    page(app.baseUrl, () => {
      app.route = 'editor';
      setFocus(app.route);
    });

    // 404
    page('*', () => {
      app.$.toast.text = 'Can\'t find: ' + window.location.href  + '. Redirected you to Home Page';
      app.$.toast.show();
      page.redirect(app.baseUrl);
    });

    // add #! before urls
    page({
      hashbang: true
    });

  });