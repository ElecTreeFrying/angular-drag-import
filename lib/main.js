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

  insertStatement(relativePath, editor) {

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

  notify(options, fromExtname, toExtname) {
    const { isSameValid, notSupportedValid, invalidFile, isDirectory } = options;
    const notif = atom.notifications;
    const append = fromExtname.toUpperCase().substring(1);

    invalidFile                                               ? notif.addWarning(`Unable to import ${fromExtname} to ${toExtname}.`)
    : isDirectory && toExtname !== ''                         ?   notif.addError('File not found.')
    : fromExtname === '' && toExtname === ''                  ?   notif.addError('Active pane not found.')
    : !invalidFile && isSameValid                             ?    notif.addInfo('Same file path.')
    : !invalidFile && notSupportedValid                       ? notif.addWarning(`${append} files not supported.`)
    : !invalidFile && !isSameValid && notSupportedValid === 0 ? notif.addWarning(`Same file path. ${append} files not supported.`)
    : !invalidFile && !notSupportedValid && isSameValid === 0 ?   notif.addError('Import failed.') : 0;
  },

  setup(item, activePane) {

    const enableNotif    = !this.param.disableNotifs;
    const isFile         = item.target.hasOwnProperty('file');
    const isDirectory    = item.target.hasOwnProperty('directory');
    const validFileTypes = [ '.ts', '.tsx' ];
    const fromPath       = isFile ? item.target.file.path : '';
    const toPath         = activePane.getPath().toString();
    const relativePath   = relative(toPath, fromPath);
    const fromExtname    = path.extname(fromPath);
    const toExtname      = path.extname(toPath);
    const fromIsValid    = validFileTypes.some(el => fromExtname.includes(el));
    const toIsValid      = validFileTypes.some(el => toExtname.includes(el));
    const isSamePath     = (fromPath === toPath);
    const isBothValid    = (fromIsValid && toIsValid);
    const isSameType     = (fromExtname === toExtname);

    if (isSamePath && isBothValid && isSameType && enableNotif)
      this.notify({ invalidFile: false, isSameValid: true, notSupportedValid: 0, isDirectory }, fromExtname, toExtname);
    else if (!isSamePath && !isBothValid && isSameType && enableNotif)
      this.notify({ invalidFile: false, isSameValid: 0, notSupportedValid: true, isDirectory }, fromExtname, toExtname);
    else if (isSamePath && !isBothValid && isSameType && enableNotif)
      this.notify({ invalidFile: false, isSameValid: false, notSupportedValid: 0, isDirectory }, fromExtname, toExtname);
    else if (!isSamePath && !isBothValid && !isSameType && enableNotif)
      this.notify({ invalidFile: false, isSameValid: 0, notSupportedValid: false, isDirectory }, fromExtname, toExtname);
    else if (!isSamePath && isBothValid && !isSameType && enableNotif)
      this.notify({ invalidFile: true, isSameValid: 0, notSupportedValid: 0, isDirectory }, fromExtname, toExtname);
    else if (!isSamePath && isBothValid && isSameType)
      this.insertStatement(relativePath, activePane)
  },

  activate(state) {

    this.subscriptions = new subAtom();
    this.initializeApp();

    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {

      const editorView = atom.views.getView(editor);
      const lines = editorView.querySelector('.lines');
      const leftDock = atom.workspace.paneContainers.left.refs.wrapperElement;

      let valid = false;
      lines.addEventListener("dragenter", () => (valid = true),  false);
      leftDock.addEventListener("dragenter", (e) => e.target.ondragenter = () => (valid = false), false);

      this.subscriptions.add(lines, "drop", (_lines) => {
        _lines.preventDefault();

        leftDock.ondragend = (item) => {
          const activePane = atom.workspace.getActiveTextEditor();

          valid && activePane ? this.setup(item, activePane) : this.notify({ }, '', '');
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
