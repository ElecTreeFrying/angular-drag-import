'use babel';

import relative from 'relative';
import subAtom from 'sub-atom';
import camelcase from 'camelcase';

class AngularDragImportView {
  constructor(serializedState) {}
  serialize() {}
  destroy() { this.element.remove(); }
  getElement() { return this.element; }
}

export default {

  angularDragImportView: null,
  subscriptions: null,
  importPosition: atom.config.get('angular-drag-import.importPosition'),
  importCursor: atom.config.get('angular-drag-import.importCursor'),
  importQuote: atom.config.get('angular-drag-import.importQuote'),

  config: {
    importQuote: {
      order: 1,
      title: 'Quote character around imported path',
      type: 'boolean',
      default: true,
      enum: [   { value: true, description: 'Single quotes' },
                { value: false, description: 'Double quotes' }    ]
    },
    importPosition: {
      order: 2,
      title: 'Import position',
      description: "Append the import line at the end of the import list.",
      type: 'boolean',
      default: false
    },
    importCursor: {
      order: 3,
      title: 'Import on mouse cursor',
      description: "Append the import line on the selected line.",
      type: 'boolean',
      default: false
    }
  },

  initState(state) {
    this.angularDragImportView = new AngularDragImportView(state.angularDragImportViewState);
    this.subscriptions = new subAtom();
    this.configObserver();
  },

  configObserver() {
    atom.config.observe('angular-drag-import.importPosition', (newValue) => {
      this.importPosition = newValue;
      const importCond = this.importPosition === this.importCursor;
      if (!this.importPosition && !this.importCursor) return;
      typeof newValue === 'boolean' && importCond ? atom.config.set('angular-drag-import.importCursor', newValue ? 'false' : 'true') : 0
    });
    atom.config.observe('angular-drag-import.importCursor', (newValue) => {
      this.importCursor = newValue;
      const importCond = this.importPosition === this.importCursor;
      if (!this.importPosition && !this.importCursor) return;
      typeof newValue === 'boolean' && importCond ? atom.config.set('angular-drag-import.importPosition', newValue ? 'false' : 'true') : 0;
    });
    atom.config.observe('angular-drag-import.importQuote', (newValue) => (this.importQuote = newValue));
  },

  toImportCursor(buffer, newPath, editor) {
    buffer = buffer.split('\n');
    cursorPosition = atom.workspace.getActiveTextEditor().getCursorBufferPosition().row;
    buffer.splice(cursorPosition, 0, newPath);
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

  calculatePath(editor) {
    let selectedSpan = document.querySelector('.file.entry.list-item.selected>span');
    if (!selectedSpan) return;
    const from = selectedSpan.dataset.path.toString();
    const to = editor.getPath().toString();
    if (from === to) return;
    const buffer = editor.getText().toString();
    const path = relative(to, from).split('\\').join('/').split('.ts')[0];
    const from_isTs = from.split('.ts').length === 2;
    const to_isTs = to.split('.ts').length === 2;
    if (!from_isTs || !to_isTs) return;
    let importName = path.split('/').reverse()[0];
    importName = camelcase(importName, { pascalCase: true });
    this.popNotif(importName, path, buffer, editor, path[0] !== '.');
  },

  popNotif(importPath, path, buffer, editor, isSameFolder) {
    const singleOtherFolder = `'${path}'`,
          doubleOtherFolder = `"${path}"`,
          singleSameFolder = `'./${path}'`,
          doubleSameFolder = `"./${path}"`;
    const newPath = `import { ${importPath} } from ${isSameFolder ? this.importQuote ? singleSameFolder : doubleSameFolder : this.importQuote ? singleOtherFolder : doubleOtherFolder};`;
    this.importCursor ? this.toImportCursor(buffer, newPath, editor) : 0;
    this.importPosition ? this.toImportPositionBottom(buffer, newPath, editor) : this.toImportPositionTop(buffer, newPath, editor);
    atom.notifications.addSuccess(`Successfully added ${importPath} to path.`);
  },

  activate(state) {
    this.initState(state);
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      const editorView = atom.views.getView(editor);
      const lines = editorView.querySelector('.lines');
      this.subscriptions.add(lines, 'drop', e => (this.calculatePath(editor)));
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
    this.angularDragImportView.destroy();
  },

  serialize() {
    return { angularDragImportViewState: this.angularDragImportView.serialize() };
  }

};
