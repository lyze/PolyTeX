suite('my-greeting tests', function() {
      var greeting, header;

      setup(function() {
        greeting = fixture('basic');
      });

      test('Welcome!', function() {
        header = greeting.$$('h1');
        assert.equal(header.textContent, 'Welcome!');
      });

    });