Polymer({
      is: 'gtex-code-textarea',
      properties: {
        animated: Boolean,
        elevation: Number,
        editorOptions: {
          type: Object,
          observer: '_setCodeMirrorOptions',
        },
        codeMirror: {
          type: Object,
          readOnly: true
        }
      },

      factoryImpl: function (editorOptions) {
        this.editorOptions = editorOptions;
      },

      ready: function () {
        this.scopeSubtree(this.$.ironTextArea.$.textarea.parentNode, true);
        // The editor is messed up if CodeMirror is initialized with options immediately.
        // this._setCodeMirror(CodeMirror.fromTextArea(this.$.ironTextArea.$.textarea, this.editorOptions));
        this._setCodeMirror(CodeMirror.fromTextArea(this.$.ironTextArea.$.textarea));
        this._setCodeMirrorOptions(this.editorOptions);
      },

      _setCodeMirrorOptions: function (newOptions) {
        if (this.codeMirror === undefined) {
          this.editorOptions = newOptions;
        } else {
          for (let k of Object.keys(newOptions)) {
            this.codeMirror.setOption(k, newOptions[k]);
          }
        }
      },

      // Getters and setters because CodeMirror's change event is efficient for
      // its own uses but makes it not so easy and not so efficient to implement
      // two-way binding
      getValue: function () {
        if (this.codeMirror === undefined) {
          return '';
        }
        return this.codeMirror.getValue();
      },

      setValue: function (v) {
        if (this.codeMirror === undefined) {
          this.value = v;
        } else {
          this.codeMirror.setValue(v);
        }
      }
    });