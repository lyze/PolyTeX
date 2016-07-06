// @license Copyright David Xu, 2016

export class RealtimeEditor {

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

  attachNewCursorElement(collaborator) {
    var cursorDiv = document.createElement('div');
    cursorDiv.className = 'PolyTeX-collaborator-cursor';

    var caretDiv = document.createElement('div');
    caretDiv.className = 'PolyTeX-collaborator-cursor-caret';
    caretDiv.style.borderColor = collaborator.color;
    caretDiv.textContent = '\xA0'; // &nbsp;

    var nameDiv = document.createElement('div');
    nameDiv.className = 'PolyTeX-collaborator-cursor-name';
    nameDiv.textContent = collaborator.displayName;
    nameDiv.style.backgroundColor = collaborator.color;
    nameDiv.style.color = 'white';

    caretDiv.addEventListener('mouseenter', _ => {
      nameDiv.style.transition = 'opacity 0.20s ease-in-out';
      nameDiv.style.opacity = 1;
    });
    caretDiv.addEventListener('mouseleave', _ => {
      nameDiv.style.transition = 'opacity 0.20s ease-out 3s';
      nameDiv.style.opacity = 0;
    });

    cursorDiv.appendChild(nameDiv);
    cursorDiv.appendChild(caretDiv);
    return cursorDiv;
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
      console.log('collaborator', c.collaborator);
      c.cursor = this.attachNewCursorElement(c.collaborator);
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

  realtimeOnLoaded(doc) {
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

    const processChange = change => {
      var start = codeMirrorDoc.indexFromPos(change.from);

      // Compute the index in the document before this change for a removal
      // range. We cannot just use indexFromPos again because the CodeMirror
      // document already has the changes reflected. If the pre-change
      // position is out of range in the post-change document, then the index
      // is clipped.
      if (change.removed.length > 0) {
        var numRemovedChars = change.removed.reduce((sum, line) => sum + line.length,
                                                    change.removed.length - 1);
        var end = start + numRemovedChars;
        collaborativeString.removeRange(start, end);
      }
      var inserted = change.text.join('\n');
      if (inserted) {
        collaborativeString.insertString(start, inserted);
      }
    };

    this.codeMirrorChangesListener = (_, changes) => {
      // If the origin is +PolyTeX-collaborator, then the update to the model
      // already happened.
      const localChanges = changes.filter(c => c.origin !== '+PolyTeX-collaborator');
      if (localChanges.length === 0) {
        return;
      }
      console.log('local changes', localChanges);
      model.beginCompoundOperation();
      for (let change of localChanges) {
        processChange(change);
      }
      model.endCompoundOperation();
    };
    this.codeMirror.on('changes', this.codeMirrorChangesListener);

    console.log('Loaded realtime components.');
  };

  init(fileId, opt_realtimeLoadErrorFn, opt_refreshAuthErrorFn) {
    console.log('Connecting realtime API...');

    // I'm assuming that this.initializeModel and realtimeOnLoaded are both
    // executed in the same synchronous block
    return new Promise((resolve, reject) => {
      this.realtime.load(fileId,
                         (...args) => {
                           this.realtimeOnLoaded.bind(this)(...args);
                           resolve();
                         },
                         this.initializeModel,
                         opt_realtimeLoadErrorFn, opt_refreshAuthErrorFn);
    });
  }
}
