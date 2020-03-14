class ConfigRetrieval {

  constructor() {}

  get importQuote() {    return atom.config.get('angular-drag-import.importQuote') }
  get addExportName() {  return atom.config.get('angular-drag-import.addExportName') }
  get addSemicolon() {   return atom.config.get('angular-drag-import.addSemicolon') }
  get importPosition() { return atom.config.get('angular-drag-import.importPosition') }
  get importCursor() {   return atom.config.get('angular-drag-import.importCursor') }
  get closeAllNotif() {  return atom.config.get('angular-drag-import.closeAllNotif') }

}

module.exports = {
  retrieval: new ConfigRetrieval(),
  registrar: {
    importQuote: {
      order: 1,
      title: 'Quote style',
      description: 'Select a quote style of import path.',
      type: 'boolean',
      default: true,
      enum: [   { value: true,  description: 'Single quotes' },
                { value: false, description: 'Double quotes' }    ]
    },
    addExportName: {
      order: 2,
      title: 'Export name',
      description: "Include component name in import statement.",
      type: 'boolean',
      default: true
    },
    importPosition: {
      order: 3,
      title: 'Import position',
      description: "Append import statements at the bottom of the list.",
      type: 'boolean',
      default: true
    },
    importCursor: {
      order: 4,
      title: 'Import on mouse cursor',
      description: "Append import on selected line.",
      type: 'boolean',
      default: false
    },
    addSemicolon: {
      order: 5,
      title: 'Semicolon',
      description: "Add semicolon at the end of import statement.",
      type: 'boolean',
      default: true
    },
    disableNotifs: {
      order: 6,
      title: 'Disable all notifications',
      description: 'Disable all notifications on file drop to active pane. ',
      type: 'boolean',
      default: false
    },
    closeAllNotif: {
      order: 7,
      title: 'Close all notifications on ESC',
      description: "Close all active notifications on Escape keydown",
      type: 'boolean',
      default: false
    }
  }
};
