class ConfigRetrieval {

  constructor() {}

  get importQuote() {
    return atom.config.get('angular-drag-import.importQuote');
  }

  get addExportName() {
    return atom.config.get('angular-drag-import.addExportName');
  }

  get addSemicolon() {
    return atom.config.get('angular-drag-import.addSemicolon');
  }

  get importPosition() {
    return atom.config.get('angular-drag-import.importPosition');
  }

  get importCursor() {
    return atom.config.get('angular-drag-import.importCursor');
  }

  get closeAllNotifications() {
    return atom.config.get('angular-drag-import.closeAllNotifications');
  }

}

module.exports = {
  retrieval: new ConfigRetrieval(),
  registrar: {
    importQuote: {
      order: 1,
      title: 'Quote type around import path',
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
      description: "Include semicolon to import line.",
      type: 'boolean',
      default: true
    },
    importPosition: {
      order: 4,
      title: 'Import position',
      description: "Append import line at the end of the import list.",
      type: 'boolean',
      default: true
    },
    importCursor: {
      order: 5,
      title: 'Import on mouse cursor',
      description: "Append import on selected line.",
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
  }
};
