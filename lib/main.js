'use babel';

import path from 'path';
import relative from 'relative';
import subAtom from 'sub-atom';
import camelcase from 'camelcase';

const { retrieval, registrar } = require('./package-configs');

export default {

  subscriptions: null,
  config: registrar,

  initializeApp() {

    this.param = retrieval;

    atom.config.observe('angular-drag-import.importPosition', (newValue) => {
      this.param.importPosition = newValue;
      const entryCond = !this.param.importPosition && !this.param.importCursor;
      const importCond = this.param.importPosition === this.param.importCursor;
      if (entryCond) return;
      typeof newValue === 'boolean' && importCond
        ? atom.config.set('angular-drag-import.importCursor', newValue ? 'false' : 'true') : 0;
    });

    atom.config.observe('angular-drag-import.importCursor', (newValue) => {
      this.param.importCursor = newValue;
      const entryCond = !this.param.importPosition && !this.param.importCursor;
      const importCond = this.param.importPosition === this.param.importCursor;
      if (entryCond) return;
      typeof newValue === 'boolean' && importCond
        ? atom.config.set('angular-drag-import.importPosition', newValue ? 'false' : 'true') : 0;
    });

    atom.config.observe('angular-drag-import.importQuote', (newValue) => (this.param.importQuote = newValue));
    atom.config.observe('angular-drag-import.addExportName', (newValue) => (this.param.addExportName = newValue));
    atom.config.observe('angular-drag-import.disableNotifs', (newValue) => (this.param.disableNotifs = newValue));
    atom.config.observe('angular-drag-import.addSemicolon', (newValue) => (this.param.addSemicolon = newValue));
    atom.config.observe('angular-drag-import.closeAllNotif', (newValue) => (this.param.closeAllNotif = newValue));
  },

  toImportCursor(importText, editor, importName, cursorPosition) {

    const currentPosition = editor.getCursorBufferPosition();
    editor.setCursorBufferPosition([cursorPosition.row, 0]);
    editor.insertText(`${importText}\n`);
    editor.setCursorBufferPosition(currentPosition);

    this.successNotif = { importName, editor };
  },

  toImportPositionTop(importText, editor, importName) {

    const currentPosition = editor.getCursorBufferPosition();
    editor.setCursorBufferPosition([0, 0]);
    editor.insertText(`${importText}\n`);
    editor.setCursorBufferPosition(currentPosition);

    this.successNotif = { importName, editor };
  },

  toImportPositionBottom(importText, editor, importName, cursorPosition) {

    const curPosition  = editor.getCursorBufferPosition();
    const dragFileText = editor.getText().toString();
    const activePane   = atom.workspace.getActiveTextEditor();

    let replaceIndex   = 0,
        breakPoint     = false;

    dragFileText.split('\n').forEach((e, i) => {
      const includesImport  = e.includes('import') || e.includes('require(');
      const includesQuote   = /['||"]/.test(e);
      const cond = (includesImport && includesQuote) && !breakPoint;
      cond ? replaceIndex++ : breakPoint = true;
    });

    editor.setCursorBufferPosition([replaceIndex, 0]);
    editor.insertText(`${importText}\n`);
    editor.setCursorBufferPosition(curPosition);

    this.successNotif = { importName, editor };
  },

  removeExtname(relativePath, extname) {
    const  normalizeLinux   =   relativePath.split('\\').join('/');
    const  normalizeWindows = normalizeLinux.split('//').join('/');
    return normalizeWindows.split(extname)[0];
  },

  set successNotif(config) {

    const _path     = config.editor.getPath().toString();
    const extname   = path.extname(_path);
    const enableNotif = !this.param.disableNotifs;

    this.param.addExportName && extname.includes('ts') && enableNotif
      ? atom.notifications.addSuccess(`Successfully added ${config.importName} to import!`)
        : enableNotif ? atom.notifications.addSuccess(`New import added!`) : 0;
  },

  popNotif(relativePath, editor) {

    const _path     = editor.getPath().toString();
    const extname   = path.extname(_path);
    const cleanPath = this.removeExtname(relativePath, extname);

    let importName = cleanPath.split('/').reverse()[0];
        importName = camelcase(importName, { pascalCase: true });

    const cursorPosition =
      atom.workspace.getActiveTextEditor() != undefined
        ? atom.workspace.getActiveTextEditor().getCursorBufferPosition() : 0;

    const isSameDir = cleanPath[0] === '.';
    const singleOtherDir = `'${cleanPath}'`,
          doubleOtherDir = `"${cleanPath}"`,
          singleSameDir = `'./${cleanPath}'`,
          doubleSameDir = `"./${cleanPath}"`;

    const importNameText = this.param.addExportName ? importName : '';
    const isSemicolon = this.param.addSemicolon ? ';' : '';
    const pathQuote = isSameDir
          ? this.param.importQuote ? singleOtherDir : doubleOtherDir
          : this.param.importQuote ? singleSameDir : doubleSameDir;

    const importText = `import { ${importNameText} } from ${pathQuote}${isSemicolon}`;

    this.param.importCursor
      ? this.toImportCursor(importText, editor, importName, cursorPosition)
      : this.param.importPosition
        ? this.toImportPositionBottom(importText, editor, importName, cursorPosition)
        : this.toImportPositionTop(importText, editor, importName);
  },

  warnNotif(options, fromFileType, toFileType) {

    const { isSameValid, notSupportedValid, invalidFileTrue } = options;
    const notif = atom.notifications;
    const append = fromFileType.toUpperCase().substring(1);

    invalidFileTrue                                               ? notif.addWarning(`Unable to import ${fromFileType} to ${toFileType}.`)
    : !invalidFileTrue && isSameValid                             ?    notif.addInfo('Same file path.')
    : !invalidFileTrue && notSupportedValid                       ? notif.addWarning(`${append} files not supported.`)
    : !invalidFileTrue && !isSameValid && notSupportedValid === 0 ? notif.addWarning(`Same file path. ${append} files not supported.`)
    : !invalidFileTrue && !notSupportedValid && isSameValid === 0 ?   notif.addError('Import failed.') : 0;
  },

  calculatePath(editor) {

    if (editor.getPath() === undefined) return;

    const enableNotif    = !this.param.disableNotifs;
    const selectedSpan   = atom.document.querySelector('.file.entry.list-item.selected > span');
    if (!selectedSpan)
      if (enableNotif) return atom.notifications.addError('File not found.');

    const activePane     = atom.workspace.getActiveTextEditor();
    const validFileTypes = [ '.ts', '.tsx' ];
    const fromPath       = selectedSpan.dataset.path.toString();
    const toPath         = activePane.getPath().toString();
    const relativePath   = relative(toPath, fromPath);
    const fromFileType   = path.extname(fromPath);
    const toFileType     = path.extname(toPath);
    const from_valid     = validFileTypes.some(el => fromFileType.includes(el));
    const to_valid       = validFileTypes.some(el => toFileType.includes(el));
    const isSamePath     = (fromPath === toPath);
    const isBothValid    = (from_valid && to_valid);
    const isSameType     = (fromFileType === toFileType);

    if (isSamePath && isBothValid && isSameType && enableNotif)
      this.warnNotif({ invalidFileTrue: false, isSameValid: true, notSupportedValid: 0 }, fromFileType, toFileType);
    else if (!isSamePath && !isBothValid && isSameType && enableNotif)
      this.warnNotif({ invalidFileTrue: false, isSameValid: 0, notSupportedValid: true }, fromFileType, toFileType);
    else if (isSamePath && !isBothValid && isSameType && enableNotif)
      this.warnNotif({ invalidFileTrue: false, isSameValid: false, notSupportedValid: 0 }, fromFileType, toFileType);
    else if (!isSamePath && !isBothValid && !isSameType && enableNotif)
      this.warnNotif({ invalidFileTrue: false, isSameValid: 0, notSupportedValid: false }, fromFileType, toFileType);
    else if (!isSamePath && isBothValid && !isSameType && enableNotif)
      this.warnNotif({ invalidFileTrue: true, isSameValid: 0, notSupportedValid: 0 }, fromFileType, toFileType);
    else if (!isSamePath && isBothValid && isSameType)
      this.popNotif(relativePath, editor)
  },

  activate(state) {

    this.subscriptions = new subAtom();
    this.initializeApp();

    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {

      const editorView = atom.views.getView(editor);
      const lines = editorView.querySelector('.lines');
      const leftDock = atom.workspace.paneContainers.left.refs.wrapperElement;
      const directories = atom.document.querySelector('[class*="tree-view-root"]');

      let valid = false;;
      lines.addEventListener("dragenter", () => (valid = true), false);
      directories.addEventListener("dragleave", () => (valid = false), false);

      this.subscriptions.add(lines, "drop", (_lines) => {
        _lines.preventDefault();

        leftDock.ondragend = (_leftDock) => {
          valid ? this.calculatePath(editor) : 0;
        }
      });

      this.subscriptions.add(lines, 'keydown', e => {
        if (e.originalEvent.key === 'Escape') {
          const closeAll = document.querySelectorAll('atom-workspace .close');
          this.param.closeAllNotif
            ? closeAll.forEach((a) => (a.click()))
            : closeAll.forEach((a, i) => (closeAll.length === (i + 1) ? a.click() : 0));
        }
      });
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
  }

};
