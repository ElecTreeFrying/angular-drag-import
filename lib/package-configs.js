class ConfigRetrieval {

  constructor() {}

  get closeAllNotifications() {
    return atom.config.get('angular-drag-import.closeAllNotifications');
  }

  get importPosition() {
    return atom.config.get('angular-drag-import.importPosition');
  }

  get addExportName() {
    return atom.config.get('angular-drag-import.addExportName');
  }

  get addSemicolon() {
    return atom.config.get('angular-drag-import.addSemicolon');
  }

  get importCursor() {
    return atom.config.get('angular-drag-import.importCursor');
  }

  get importQuote() {
    return atom.config.get('angular-drag-import.importQuote');
  }

}

module.exports = {
  retrieval: new ConfigRetrieval(),
  registrar: {
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
  }
};
