'use babel';

import relative from 'relative';
import subAtom from 'sub-atom';
import camelcase from 'camelcase';

import MainView from './main-view';
const { retrieval, registrar } = require('./package-configs');

export default {

  angularDragImportView: null,
  subscriptions: null,
  config: registrar,

  initializeApp() {
    this.closeAllNotifications = retrieval.closeAllNotifications;
    this.param = {
      importPosition: retrieval.importPosition,
      addExportName: retrieval.addExportName,
      addSemicolon: retrieval.addSemicolon,
      importCursor: retrieval.importCursor,
      importQuote: retrieval.importQuote
    };
    atom.config.observe('angular-drag-import.importPosition', (newValue) => {
      this.param.importPosition = newValue;
      const entryCond = !this.param.importPosition && !this.param.importCursor;
      const importCond = this.param.importPosition === this.param.importCursor;
      if (entryCond) return;
      typeof newValue === 'boolean' && importCond ? atom.config.set('angular-drag-import.importCursor', newValue ? 'false' : 'true') : 0;
    });
    atom.config.observe('angular-drag-import.importCursor', (newValue) => {
      this.param.importCursor = newValue;
      const entryCond = !this.param.importPosition && !this.param.importCursor;
      const importCond = this.param.importPosition === this.param.importCursor;
      if (entryCond) return;
      typeof newValue === 'boolean' && importCond ? atom.config.set('angular-drag-import.importPosition', newValue ? 'false' : 'true') : 0;
    });
    atom.config.observe('angular-drag-import.closeAllNotifications', (newValue) => (this.closeAllNotifications = newValue));
    atom.config.observe('angular-drag-import.addExportName', (newValue) => (this.param.addExportName = newValue));
    atom.config.observe('angular-drag-import.addSemicolon', (newValue) => (this.param.addSemicolon = newValue));
    atom.config.observe('angular-drag-import.importQuote', (newValue) => (this.param.importQuote = newValue));
  },

  toImportCursor(buffer, newPath, editor, cursorPosition) {
    buffer = buffer.split('\n');
    buffer.splice(cursorPosition.row, 0, newPath);
    buffer = buffer.join('\n');
    editor.setText(buffer);
  },

  toImportPositionTop(buffer, newPath, editor, importCursor) {
    const newText = `${newPath}\n${buffer}`;
    !importCursor ? editor.setText(newText) : 0;
  },

  toImportPositionBottom(buffer, newPath, editor, cursorPosition) {
    let replaceIndex = 0;
    buffer.split('\n').forEach((e, i) => (!e.includes('import') && replaceIndex === 0 ? replaceIndex = i : 0));
    buffer = buffer.split('\n');
    buffer.splice(replaceIndex, 0, newPath);
    buffer = buffer.join('\n');
    editor.setText(buffer);
  },

  popNotif(importPath, path, buffer, editor, cursorPosition, isSameFolder, param) {
    const singleOtherFolder = `'${path}'`,
          doubleOtherFolder = `"${path}"`,
          singleSameFolder = `'./${path}'`,
          doubleSameFolder = `"./${path}"`;
    const newPath = `import { ${param.addExportName ? importPath : ''} } from ${isSameFolder ? param.importQuote ? singleSameFolder : doubleSameFolder : param.importQuote ? singleOtherFolder : doubleOtherFolder}${param.addSemicolon ? ';' : ''}`;
    param.importCursor ? this.toImportCursor(buffer, newPath, editor, cursorPosition) : 0;
    param.importPosition ? this.toImportPositionBottom(buffer, newPath, editor, cursorPosition) : this.toImportPositionTop(buffer, newPath, editor, param.importCursor);
    atom.notifications.addSuccess(`Successfully added ${importPath} to path.`);
  },

  warnNotif(fr, tt, isFolder) {
    const _fr = fr.split('\\');
    const _tt = tt.split('\\');
    const _from = _fr[_fr.length - 1];
    const _to = _tt[_tt.length - 1];
    const notif = atom.notifications;
    const message = `Invalid import of '${_from}' to '${_to}'`;
    const msgFolder = `Invalid file format.`;
    isFolder ? notif.addError(msgFolder) : notif.addWarning(message);
  },

  calculatePath(editor, drop) {
    const selectedSpan = document.querySelector('.file.entry.list-item.selected>span');
    const cursorPosition = atom.workspace.getActiveTextEditor() != undefined ? atom.workspace.getActiveTextEditor().getCursorBufferPosition() : 0;
    if (!selectedSpan) {
      this.warnNotif('', '', true);
      return;
    };
    const from = selectedSpan.dataset.path.toString();
    const to = editor.getPath().toString();
    if (from === to) return;
    const buffer = editor.getText().toString();
    const path = relative(to, from).split('\\').join('/').split('.ts')[0];
    const from_isTs = from.split('.ts').length === 2;
    const to_isTs = to.split('.ts').length === 2;
    !from_isTs || !to_isTs ? this.warnNotif(from, to, false) : 0;
    if (!from_isTs || !to_isTs) return;
    let importName = path.split('/').reverse()[0];
    importName = camelcase(importName, { pascalCase: true });
    this.popNotif(importName, path, buffer, editor, cursorPosition, path[0] !== '.', this.param);
  },

  activate(state) {
    this.angularDragImportView = new MainView(state.angularDragImportViewState);
    this.subscriptions = new subAtom();
    this.initializeApp();

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
