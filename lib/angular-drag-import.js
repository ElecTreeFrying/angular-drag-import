'use babel';

import AngularDragImportView from './angular-drag-import-view';
import { CompositeDisposable } from 'atom';
import relative from 'relative';
import subAtom from 'sub-atom';
import camelcase from 'camelcase';

export default {

  angularDragImportView: null,
  modalPanel: null,
  subscriptions: null,
  importPosition: null,
  importCursor: null,
  importQuote: null,

  initState(state) {
    this.config = require('./angular-drag-import-package-configs').registrar;
    this.angularDragImportView = new AngularDragImportView(state.angularDragImportViewState);
    this.subscriptions = new CompositeDisposable();
    this.subscriptions = new subAtom();
    this.importPosition = atom.config.get('angular-drag-import.importPosition');
    this.importCursor = atom.config.get('angular-drag-import.importCursor');
    this.importQuote = atom.config.get('angular-drag-import.importQuote');
    this.configObserver();
  },

  configObserver() {
    atom.config.observe('angular-drag-import.importPosition', (newValue) => {
      this.importPosition = newValue;
      const importCond = this.importPosition === this.importCursor;
      if (!this.importPosition && !this.importCursor) return;
      if (typeof newValue === 'boolean' && importCond) {
        newValue
          ? atom.config.set('angular-drag-import.importCursor', 'false')
          : atom.config.set('angular-drag-import.importCursor', 'true');
      }
    });
    atom.config.observe('angular-drag-import.importCursor', (newValue) => {
      this.importCursor = newValue;
      const importCond = this.importPosition === this.importCursor;
      if (!this.importPosition && !this.importCursor) return;
      if (typeof newValue === 'boolean' && importCond) {
        newValue
          ? atom.config.set('angular-drag-import.importPosition', 'false')
          : atom.config.set('angular-drag-import.importPosition', 'true');
      }
    });
    atom.config.observe('angular-drag-import.importQuote', (newValue) => {
      this.importQuote = newValue;
    });
  },

  toImportCursor(buffer, newPath, editor) {
    buffer = buffer.split('\n');
    cursorPosition = atom.workspace.getActiveTextEditor().getCursorBufferPosition().row;
    buffer.splice(cursorPosition + 1, 0, newPath);
    buffer = buffer.join('\n');
    editor.setText(buffer);
  },

  toImportPositionTop(buffer, newPath, editor) {
    if (this.importCursor) return;
    const newText = `${newPath}\n${buffer}`;
    editor.setText(newText);
  },

  toImportPositionBottom(buffer, newPath, editor) {
    let replaceIndex = 0;
    cursorPosition = atom.workspace.getActiveTextEditor().getCursorBufferPosition();
    buffer.split('\n').forEach((e, i) => (!e.includes('import') && replaceIndex === 0 ? replaceIndex = i : 0));
    buffer = buffer.split('\n');
    buffer.splice(replaceIndex, 0, newPath);
    buffer = buffer.join('\n');
    editor.setText(buffer);
  },

  popNotif(importPath, path, buffer, editor, editorView, isSameFolder) {
    const newPath = this.importQuote
      ? isSameFolder
        ? `import { ${importPath} } from '${path}';`
        : `import { ${importPath} } from './${path}';`
      : isSameFolder
        ? `import { ${importPath} } from "${path}";`
        : `import { ${importPath} } from "./${path}";`;


    this.importCursor ? this.toImportCursor(buffer, newPath, editor) : 0;
    this.importPosition ? this.toImportPositionBottom(buffer, newPath, editor) : this.toImportPositionTop(buffer, newPath, editor);
    atom.notifications.addSuccess(`Successfully added ${importPath} to path.`);
  },

  activate(state) {
    this.initState(state);
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      const editorView = atom.views.getView(editor);
      const lines = editorView.querySelector('.lines');
      this.subscriptions.add(lines, 'drop', e => {
        try {
          let selectedSpan = document.querySelector('.file.entry.list-item.selected>span');
          const to = selectedSpan.dataset.path;
          const from = editor.getPath();
          if (to === from) return;
          const buffer = editor.getText();
          const includesTs = from.toString().split('\\').join('/').includes('.ts');
          const isTs = relative(from, to).toString().split('\\').join('/').includes('.ts');
          const path = relative(from, to).toString().split('\\').join('/').split('.ts')[0];
          let importPath = path.split('/').reverse()[0];
          importPath = camelcase(importPath, { pascalCase: true });
          isTs && includesTs
            ? path[0] === '.'
              ? this.popNotif(importPath, path, buffer, editor, editorView, true)
              : this.popNotif(importPath, path, buffer, editor, editorView, false)
            : 0;
        } catch (e) { }
      });
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.angularDragImportView.destroy();
  },

  serialize() {
    return { angularDragImportViewState: this.angularDragImportView.serialize() };
  }

};
