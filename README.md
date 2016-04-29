# PolyTeX

A LaTeX editor that can compile PDFs entirely in your browser.

Currently, it only requires a server that can serve static assets from the TeX
Live distribution.

Powered by [texlive.js](//github.com/manuels/texlive.js) and
[Polymer](//github.com/Polymer/polymer).

[Demo](//lyze.github.io/PolyTeX)

## TODOs

- [ ] Integrate Google Drive API
  - [ ] Realtime API
  - [ ] Drive App

- [ ] Help improve [texlive.js](//github.com/manuels/texlive.js)

- [ ] Support local TeX Live distribution (with a Chrome app or extension)

- [ ] Make the compile log go away without having to give focus and hit `ESC`
  (probably something to do with using an `iron-autogrow-textarea`...)

- [ ] Refactoring


## Install dependencies

#### Quick-start (for experienced users)

With Node.js installed, run the following one liner from the root of your Polymer Starter Kit download:

```sh
npm install -g gulp bower && npm install && bower install
```

#### Prerequisites (for everyone)

**To install dependencies:**

1)  Check your Node.js version.

```sh
node --version
```

The version should be at or above 0.12.x.

2)  If you don't have Node.js installed, or you have a lower version, go to [nodejs.org](https://nodejs.org) and click on the big green Install button.

3)  Install `gulp` and `bower` globally.

```sh
npm install -g gulp bower
```

This lets you run `gulp` and `bower` from the command line.

4)  Install the starter kit's local `npm` and `bower` dependencies.

```sh
cd polymer-starter-kit && npm install && bower install
```

This installs the element sets (Paper, Iron, Platinum) and tools the starter kit
requires to build and serve apps.

### Development workflow

#### Serve / watch

```sh
gulp serve
```

This outputs an IP address you can use to locally test and another that can be
used on devices connected to your network.

#### Run tests

```sh
gulp test:local
```

This runs the unit tests defined in the `app/test` directory through
[web-component-tester](https://github.com/Polymer/web-component-tester).

To run tests Java 7 or higher is required. To update Java go to
http://www.oracle.com/technetwork/java/javase/downloads/index.html and download
***JDK*** and install it.

#### Build & Vulcanize

```sh
gulp
```

Build and optimize the current project, ready for deployment. This includes
vulcanization, image, script, stylesheet and HTML optimization and minification.
