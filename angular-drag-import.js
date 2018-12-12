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
  closeAllNotifications: atom.config.get('angular-drag-import.closeAllNotifications'),
  importPosition: atom.config.get('angular-drag-import.importPosition'),
  addExportName: atom.config.get('angular-drag-import.addExportName'),
  addSemicolon: atom.config.get('angular-drag-import.addSemicolon'),
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
    addExportName: {
      order: 2,
      title: 'Add export name',
      description: "Include export name in import list.",
      type: 'boolean',
      default: true
    },
    addSemicolon: {
      order: 3,
      title: 'Add semicolon',
      description: "Include semicolon in import list.",
      type: 'boolean',
      default: true
    },
    importPosition: {
      order: 4,
      title: 'Import position',
      description: "Append the import line at the end of the import list.",
      type: 'boolean',
      default: true
    },
    importCursor: {
      order: 5,
      title: 'Import on mouse cursor',
      description: "Append the import line on the selected line.",
      type: 'boolean',
      default: false
    },
    closeAllNotifications: {
      order: 6,
      title: 'Close all notifications on ESC',
      description: "Closes all active notifications on Escape keydown",
      type: 'boolean',
      default: false
    }
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
    atom.config.observe('angular-drag-import.closeAllNotifications', (newValue) => (this.closeAllNotifications = newValue));
    atom.config.observe('angular-drag-import.addExportName', (newValue) => (this.addExportName = newValue));
    atom.config.observe('angular-drag-import.addSemicolon', (newValue) => (this.addSemicolon = newValue));
    atom.config.observe('angular-drag-import.importQuote', (newValue) => (this.importQuote = newValue));
  },

  toImportCursor(buffer, newPath, editor, cursorPosition) {
    buffer = buffer.split('\n');
    buffer.splice(cursorPosition.row, 0, newPath);
    buffer = buffer.join('\n');
    editor.setText(buffer);
  },

  toImportPositionTop(buffer, newPath, editor) {
    if (this.importCursor) return;
    const newText = `${newPath}\n${buffer}`;
    editor.setText(newText);
  },

  toImportPositionBottom(buffer, newPath, editor, cursorPosition) {
    let replaceIndex = 0;
    buffer.split('\n').forEach((e, i) => (!e.includes('import') && replaceIndex === 0 ? replaceIndex = i : 0));
    buffer = buffer.split('\n');
    buffer.splice(replaceIndex, 0, newPath);
    buffer = buffer.join('\n');
    editor.setText(buffer);
  },

  popNotif(importPath, path, buffer, editor, cursorPosition, isSameFolder) {
    const singleOtherFolder = `'${path}'`,
          doubleOtherFolder = `"${path}"`,
          singleSameFolder = `'./${path}'`,
          doubleSameFolder = `"./${path}"`;
    const newPath = `import { ${this.addExportName ? importPath : ''} } from ${isSameFolder ? this.importQuote ? singleSameFolder : doubleSameFolder : this.importQuote ? singleOtherFolder : doubleOtherFolder}${this.addSemicolon ? ';' : ''}`;
    this.importCursor ? this.toImportCursor(buffer, newPath, editor, cursorPosition) : 0;
    this.importPosition ? this.toImportPositionBottom(buffer, newPath, editor, cursorPosition) : this.toImportPositionTop(buffer, newPath, editor, cursorPosition);
    atom.notifications.addSuccess(`Successfully added ${importPath} to path.`);
  },

  calculatePath(editor) {
    const selectedSpan = document.querySelector('.file.entry.list-item.selected>span');
    const cursorPosition = atom.workspace.getActiveTextEditor() != undefined ? atom.workspace.getActiveTextEditor().getCursorBufferPosition() : 0;
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
    this.popNotif(importName, path, buffer, editor, cursorPosition, path[0] !== '.');
  },

  activate(state) {
    this.angularDragImportView = new AngularDragImportView(state.angularDragImportViewState);
    this.subscriptions = new subAtom();
    this.configObserver();
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      const editorView = atom.views.getView(editor);
      const lines = editorView.querySelector('.lines');
      this.subscriptions.add(lines, 'drop', e => (this.calculatePath(editor)));
      this.subscriptions.add(lines, 'keydown', e => {
        if (e.originalEvent.key === 'Escape') {
          const closeAll = document.querySelectorAll('atom-workspace .close');
          this.closeAllNotifications ? closeAll.forEach((a) => (a.click())) : closeAll.forEach((a, i) => (closeAll.length === (i + 1) ? a.click() : 0));
        }
      });
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
