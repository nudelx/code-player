'use babel';

import CodePlayerView from './code-player-view';
import { CompositeDisposable } from 'atom';

export default {

  codePlayerView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.codePlayerView = new CodePlayerView(state.codePlayerViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.codePlayerView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'code-player:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.codePlayerView.destroy();
  },

  serialize() {
    return {
      codePlayerViewState: this.codePlayerView.serialize()
    };
  },

  storeOriginalSelectionAndEmptyPane(editor) {
    editor.selectAll()
    const selection = editor.getSelectedText()
    this.original = selection
    editor.delete()
  },



  toggle() {
    console.log('CodePlayer was toggled!');
    // return (
    //   this.modalPanel.isVisible() ?
    //   this.modalPanel.hide() :
    //   this.modalPanel.show()
    // );
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {

      this.storeOriginalSelectionAndEmptyPane(editor)
      console.log(this)

    }
  }

};
