'use babel';

import path from 'path';
import relative from 'relative';
import subAtom from 'sub-atom';
import camelcase from 'camelcase';

import MainView from './main-view';
const { retrieval, registrar } = require('./package-configs');

export default {

  angularDragImportView: null,
  platform: process.platform,
  subscriptions: null,
  config: registrar,
  counter: 0,

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

  toImportCursor(dargFileText, importText, editor, cursorPosition) {
    dargFileText = dargFileText.split('\n');
    dargFileText.splice(cursorPosition.row, 0, importText);
    dargFileText = dargFileText.join('\n');
    editor.setText(dargFileText);
  },

  toImportPositionTop(dargFileText, importText, editor, importCursor) {
    const newText = `${importText}\n${dargFileText}`;
    !importCursor ? editor.setText(newText) : 0;
  },

  toImportPositionBottom(dargFileText, importText, editor, cursorPosition) {
    let replaceIndex = 0;
    dargFileText.split('\n').forEach((e, i) => (!e.includes('import') && replaceIndex === 0 ? replaceIndex = i : 0));
    dargFileText = dargFileText.split('\n');
    dargFileText.splice(replaceIndex, 0, importText);
    dargFileText = dargFileText.join('\n');
    editor.setText(dargFileText);
  },

  popNotif(importPath, relativePath, dargFileText, editor, cursorPosition) {

    const isSameFolder = relativePath[0] === '.';
    const singleOtherFolder = `'${relativePath}'`,
          doubleOtherFolder = `"${relativePath}"`,
          singleSameFolder = `'./${relativePath}'`,
          doubleSameFolder = `"./${relativePath}"`;

    const importText = `import { ${this.param.addExportName ? importPath : ''} } from ${isSameFolder
          ? this.param.importQuote ? singleOtherFolder : doubleOtherFolder
          : this.param.importQuote ? singleSameFolder : doubleSameFolder}${this.param.addSemicolon ? ';' : ''}`;

    this.param.importCursor ? this.toImportCursor(dargFileText, importText, editor, cursorPosition) : 0;

    this.param.importPosition
      ? this.toImportPositionBottom(dargFileText, importText, editor, cursorPosition)
      : this.toImportPositionTop(dargFileText, importText, editor, this.param.importCursor);

    atom.notifications.addSuccess(`Successfully added ${importPath} to path.`);
  },

  warnNotif(options) {
    const { isFolder, isDefault, isSame_isBothTs } = options;
    const notif = atom.notifications;

    isSame_isBothTs ? notif.addWarning('WARNING: Same file path.')
      : isSame_isBothTs === false ? notif.addWarning('WARNING: Non typescript files. Same file path.')
        : isFolder ? notif.addError(`ERROR: File not found.`)
          : isDefault ? notif.addWarning(`WARNING: Non typescript files. Unable to import.`)
            : 0;
  },

  calculatePath(editor) {

    this.counter = this.counter++;
    if (editor.getPath() === undefined) return;

    const selectedSpan = atom.document.querySelector('.file.entry.list-item.selected > span');
    if (!selectedSpan)              this.warnNotif({ isFolder: true, isDefault: false, isSame_isBothTs: 0 });

    const fromPath = selectedSpan.dataset.path.toString();
    const toPath = editor.getPath().toString();
    const dargFileText = editor.getText().toString();
    const relativePath = relative(toPath, fromPath).split('\\').join('/').split('.ts')[0];
    const fromFileType = path.extname(fromPath);
    const toFileType = path.extname(toPath);
    const from_isTs = fromFileType === '.ts' || fromFileType === '.tsx';
    const to_isTs = toFileType === '.ts' || toFileType === '.tsx';
    const isSamePath  = (fromPath === toPath);
    const isBothTs    = (from_isTs && to_isTs);

    if (isSamePath && isBothTs)       this.warnNotif({ isFolder: false, isDefault: false, isSame_isBothTs: isBothTs });
    else if (isSamePath && !isBothTs) this.warnNotif({ isFolder: false, isDefault: false, isSame_isBothTs: isBothTs });
    else if (!isBothTs)               this.warnNotif({ isFolder: false, isDefault: true, isSame_isBothTs: 0 });
    else {
      let importName = relativePath.split('/').reverse()[0];
          importName = camelcase(importName, { pascalCase: true });

      const cursorPosition =
        atom.workspace.getActiveTextEditor() != undefined
          ? atom.workspace.getActiveTextEditor().getCursorBufferPosition()
          : 0;

      this.popNotif(importName, relativePath, dargFileText, editor, cursorPosition);
    }
  },

  activate(state) {
    this.counter = 0;
    this.angularDragImportView = new MainView(state.angularDragImportViewState);
    this.subscriptions = new subAtom();
    this.initializeApp();

    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {

      const editorView = atom.views.getView(editor);
      const lines = editorView.querySelector('.lines');
      const leftDock = atom.workspace.paneContainers.left.refs.wrapperElement;

      this.subscriptions.add(lines, "drop", () => {
        leftDock.ondragend = (event) => {
          this.counter === 0 ? this.calculatePath(editor) : this.subscriptions.add(lines, "drop", () => this.calculatePath(editor));
        };
      })

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
