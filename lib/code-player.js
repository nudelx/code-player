'use babel'
import CodePlayerView from './code-player-view'
import { CompositeDisposable, Emitter } from 'atom'

export default {
  codePlayerView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.codePlayerView = new CodePlayerView(state.codePlayerViewState)
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.codePlayerView.getElement(),
      visible: false
    })

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'code-player:toggle': () => this.toggle()
      })
    )

    this.rowEvent = new Emitter()
    this.rowEvent.on('rowFinished', function() {
      console.log('row is done')
    })
  },

  deactivate() {
    this.modalPanel.destroy()
    this.subscriptions.dispose()
    this.codePlayerView.destroy()
  },

  serialize() {
    return {
      codePlayerViewState: this.codePlayerView.serialize()
    }
  },

  storeOriginalSelectionAndEmptyPane(editor) {
    editor.selectAll()
    const selection = editor.getSelectedText()
    this.original = selection
    editor.delete()
  },

  preparePresentation() {
    if (atom.config.defaultSettings.hasOwnProperty('bracket-matcher')) {
      atom.config.defaultSettings[
        'bracket-matcher'
      ].autocompleteBrackets = false
    }
    this.rows = this.original.split('\n')
  },

  printRowContent(row, editor, rowIndex) {
    const self = this
    const letters = row.split('')
    const timersRunning = {}
    for (let i = 0; i < letters.length; i++) {
      timersRunning[i] = setTimeout(function() {
        editor.insertText(letters[i])
        delete timersRunning[i]
        if (!Object.keys(timersRunning).length)
          self.rowEvent.emit('rowFinished')
      }, 200 * i)
    }
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  wait(waitTime) {
    const dt = new Date()
    while (new Date() - dt <= waitTime) {
      /* Do nothing */
    }
  },

  toggle() {
    console.log('CodePlayer was toggled!')
    // return (
    //   this.modalPanel.isVisible() ?
    //   this.modalPanel.hide() :
    //   this.modalPanel.show()
    // );
    let editor
    if ((editor = atom.workspace.getActiveTextEditor())) {
      this.storeOriginalSelectionAndEmptyPane(editor)
      this.preparePresentation()
      debugger
      for (let i = 0; i < this.rows.length; i++) {
        if (this.onRow) {
        }
        editor.moveToBeginningOfLine()
        this.printRowContent(this.rows[i], editor)
      }

      // this.printRowContent(this.rows[0], editor)

      console.log('DONE')
    }
  }
}
