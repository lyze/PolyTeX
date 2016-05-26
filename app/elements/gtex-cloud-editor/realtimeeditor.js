// @license Copyright David Xu, 2016

class RealtimeEditor {

  constructor(realtime, style, codeMirror) {
    this.realtime = realtime;
    this.style = style;
    this.codeMirror = codeMirror;
  }

  close() {
    if (this.realtimeDocument) {
      this.realtimeDocument.close();
    }

    if (this.collaboratorsBySession) {
      this.detachAllCollaborators();
      this.collaboratorsBySession = null;
    }

    this.codeMirror.off('changes', this.codeMirrorListener);

    // if (this.collaborativeString) {
    //   this.collaborativeString.removeEventListener(
    //     this.realtime.api.EventType.TEXT_INSERTED,
    //     this.textInsertedListener);

    //   this.collaborativeString.removeEventListener(
    //     this.realtime.api.EventType.TEXT_DELETED,
    //     this.textDeletedListener);
    // }
    this.collaborativeString = null;
  }

  attachNewCursorElement(color) {
    var div = document.createElement('div');
    div.className = 'PolyTeX-cursor';

    div.style.border = `1px solid ${color}`;
    div.style.width = 0;
    div.style.color = color;
    div.style.display = 'inline-block';

    div.textContent = '\xA0'; // &nbsp;

    return div;
  }

  addCssRule(rule) {
    var index = this.style.sheet.cssRules.length;
    this.style.sheet.insertRule(rule, index);
    return index;
  }

  addCollaborator(collaborator) {
    this.collaboratorsBySession.set(collaborator.sessionId, {collaborator: collaborator});
  }

  static detachCollaboratorData(c) {
    if (c.bookmark) {
      c.bookmark.clear();
    }
  }

  detachAllCollaborators() {
    for (let c of this.collaboratorsBySession) {
      this.constructor.detachCollaboratorData(c);
    }
  }

  removeAllCollaborators() {
    this.detachAllCollaboratorData();
    this.collaboratorsBySession.clear();
  }

  removeCollaboratorBySessionId(id) {
    var c = this.collaboratorsBySession.get(id);
    this.collaboratorsBySession.delete(id);
    this.constructor.detachCollaboratorData(c);
  }

  updateCollaboratorCursor(id, pos) {
    if (!id) {
      return;
    }
    var c = this.collaboratorsBySession.get(id);
    if (!c.cursor) {
      c.cursor = this.attachNewCursorElement(c.collaborator.color);
    }
    if (c.bookmark) {
      c.bookmark.clear();
    }
    c.bookmark = this.codeMirror.getDoc().setBookmark(pos, {widget: c.cursor});
  }

  static initializeModel(model) {
    console.log('Initializing model...');
    var string = model.createString();
    string.setText(this.codeMirror.getValue());
    model.getRoot().set('PolyTeX-data', string);
  }

  init(fileId, opt_realtimeLoadErrorFn, opt_refreshAuthErrorFn) {
    console.log('Connecting realtime API...');

    console.log('Did not connect realtime API.');
    return; // TODO fix TEXT_DELETED event handler

    // This arrow function is declared inside here to capture `this`
    const realtimeOnLoaded = doc => {
      console.log('Loading realtime for editor components...');
      this.realtimeDocument = doc;
      var model = doc.getModel();
      var collaborativeString = model.getRoot().get('PolyTeX-data');
      this.collaborativeString = collaborativeString;
      var codeMirrorDoc = this.codeMirror.getDoc();

      var currentText = codeMirrorDoc.getValue();
      var loadedCollaborativeText = collaborativeString.getText();
      if (currentText !== loadedCollaborativeText) {
        codeMirrorDoc.setValue(loadedCollaborativeText);
        console.log('Updated content from realtime model.');
      }

      var collaborators = doc.getCollaborators();

      this.collaboratorsBySession = new Map();
      for (let collaborator of doc.getCollaborators()) {
        var cssRuleIndex;
        if (collaborator.isMe) {
          // no-op for now
          // this.addCssRule(`.CodeMirror-cursor { color: ${collaborator.color}; }`);
        } else {
          this.addCollaborator(collaborator);
        }
      }

      this.collaboratorJoinedListener = e => {
        this.addCollaborator(e.collaborator);
      };
      doc.addEventListener(this.realtime.api.EventType.COLLABORATOR_JOINED,
                           this.collaboratorJoinedListener);

      this.collaboratorLeftListener = e => {
        this.removeCollaboratorBySessionId(e.collaborator.sessionId);
      };
      doc.addEventListener(this.realtime.api.EventType.COLLABORATOR_LEFT,
                           this.collaboratorLeftListener);

      this.textInsertedListener = e => {
        if (e.isLocal) {
          return;
        }
        console.log('collaborator insertion', e);
        var start = codeMirrorDoc.posFromIndex(e.index);
        codeMirrorDoc.replaceRange(e.text, start, null, '+PolyTeX-collaborator');

        var end = codeMirrorDoc.posFromIndex(e.index + e.text.length);
        this.updateCollaboratorCursor(e.sessionId, end);
      };
      collaborativeString.addEventListener(
        this.realtime.api.EventType.TEXT_INSERTED,
        this.textInsertedListener);

      this.textDeletedListener = e => {
        if (e.isLocal) {
          return;
        }
        console.log('collaborator deletion', e);
        var start = codeMirrorDoc.posFromIndex(e.index);
        var end = codeMirrorDoc.posFromIndex(e.index + e.text.length);
        codeMirrorDoc.replaceRange('', start, end, '+PolyTeX-collaborator');

        this.updateCollaboratorCursor(e.sessionId, start);
      };
      collaborativeString.addEventListener(
        this.realtime.api.EventType.TEXT_DELETED,
        this.textDeletedListener);

      this.codeMirrorChangesListener = (_, changes) => {
        const localChanges = changes.filter(c => c.origin !== '+PolyTeX-collaborator');
        if (localChanges.length === 0) {
          return;
        }
        model.beginCompoundOperation();
        for (let change of localChanges) {
          console.log('change', change)
          // avoid bouncing between local editor changes and realtime events
          // pre-change coordinates
          var start = codeMirrorDoc.indexFromPos(change.from);
          var end = codeMirrorDoc.indexFromPos(change.to);
          if (change.removed) {
            // TODO this throws error "Class$S8" because the API is minified :/
            collaborativeString.removeRange(start, end);
          }
          var insertedLines = change.text.join('\n');
          collaborativeString.insertString(start, insertedLines);
        }
        model.endCompoundOperation();
      };
      this.codeMirror.on('changes', this.codeMirrorChangesListener);
      console.log('Loaded realtime components.');
    };

    // I'm assuming that this.initializeModel and realtimeOnLoaded are both
    // executed in the same synchronous block
    this.realtime.load(fileId, realtimeOnLoaded, this.initializeModel,
                       opt_realtimeLoadErrorFn, opt_refreshAuthErrorFn);
  }



}