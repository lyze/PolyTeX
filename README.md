# PolyTeX

A LaTeX editor that can compile PDFs entirely in your browser.
[Demo](//lyze.github.io/PolyTeX).

Currently, it only requires a server that can serve static assets from the TeX
Live distribution.

Powered by
* [texlive.js](//github.com/manuels/texlive.js)
* [Polymer](//github.com/Polymer/polymer)


## Goals

- [x] Integrate Google Drive API
  - [x] Save to Drive
  - [ ] Load from Drive
    - [x] Load from Drive by file ID
  - [x] Realtime API
    - [ ] Enhanced collaborator cursors
  - [ ] Drive application

- [ ] Help improve [texlive.js](//github.com/manuels/texlive.js)

- [ ] Support local TeX Live distribution (with a Chrome app or extension)

- [ ] Refactoring

- [ ] Tests


## Setup

```sh
npm install && bower install
```
## Development workflow

### Serve / watch

```sh
gulp serve
```
and also
```sh
gulp serve-dist
```


### Build

```sh
gulp
```
This does a clean build (i.e., `gulp clean && gulp dist`).


#### Deploy (to GitHub Pages)

```sh
gulp build-deploy-gh-pages
```
