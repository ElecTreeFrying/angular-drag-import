'use babel';

import AngularDragImportView from './angular-drag-import-view';
import { CompositeDisposable } from 'atom';
import relative from 'relative';
import subAtom from 'sub-atom';
import camelcase from 'camelcase';

export default {

  angularDragImportView: null,
  modalPanel: null,
  subscriptions: null,

  popNotif(importPath, path, buffer, editor, editorView, isSameFolder) {
    let message = `Do you want to continue import? \n\nPress "Ctrl" to import, "Esc" to cancel.`;
    const notif = atom.notifications.addWarning(message, {
      dismissable: true,
      buttons: [
        {
          text: 'Import',
          onDidClick: () => {
            const newPath = isSameFolder
              ? `import { ${importPath} } from '${path}';`
              : `import { ${importPath} } from './${path}';`;
            const newText = `${newPath}\n${buffer}`;
            editor.setText(newText);
            atom.notifications.addSuccess(`Added ${importPath} to path.`);
            notif.dismiss();
          }
        },
        {
          text: 'Cancel',
          onDidClick: () => notif.dismiss()
        }
      ]
    });

    editorView.addEventListener('keydown', e => {
      if ((event.ctrlKey || event.altKey) && message !== '') {
        event.preventDefault();
        notif.options.buttons[0].onDidClick();
        message = '';
      } else if (e.key === "Escape") {
        event.preventDefault();
        notif.dismiss();
        message = '';
      }
    })
  },

  activate(state) {
    this.angularDragImportView = new AngularDragImportView(state.angularDragImportViewState);
    this.subscriptions = new CompositeDisposable();
    this.subscriptions = new subAtom();
    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      const editorView = atom.views.getView(editor);
      const lines = editorView.querySelector('.lines');
      this.subscriptions.add(lines, 'drop', e => {
        try {
          let selectedSpan = document.querySelector('.file.entry.list-item.selected>span')
          const to = selectedSpan.dataset.path;
          const from = editor.getPath();
          if (to === from) return;
          const buffer = editor.getText();
          const includesTs = from.toString().split('\\').join('/').includes('.ts');
          const isTs = relative(from, to).toString().split('\\').join('/').includes('.ts');
          const path = relative(from, to).toString().split('\\').join('/').split('.ts')[0];
          let importPath = path.split('/').reverse()[0];
          importPath = camelcase(importPath, { pascalCase: true });
          isTs && includesTs
            ? path[0] === '.'
              ? this.popNotif(importPath, path, buffer, editor, editorView, true)
              : this.popNotif(importPath, path, buffer, editor, editorView, false)
            : 0;
        } catch (e) { }
      });
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.angularDragImportView.destroy();
  },

  serialize() {
    return {
      angularDragImportViewState: this.angularDragImportView.serialize()
    };
  }

};
