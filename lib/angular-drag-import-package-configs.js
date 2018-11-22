class ConfigRetrieval {
  constructor() {}
  get importPosition() {
    return atom.config.get('angular-drag-import.importPosition');
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
      enum: [
        { value: true, description: 'Single quotes' },
        { value: false, description: 'Double quotes' }
      ],
      default: true
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
  }
};
