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
    this.rowEvent.on('rowFinished', () => {
      console.log('row is done')
      this.shiftAndPrintRow(editor)
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

  storeOriginalSelectionAndEmptyPane() {
    const { editor } = this
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
    for (let i = 0; i < letters.length; i++) {   // avoiding async beahvior and adding emitter
      timersRunning[i] = setTimeout(function() {
        editor.insertText(letters[i])
        delete timersRunning[i]
        if (!Object.keys(timersRunning).length) {
          self.rowEvent.emit('rowFinished')
          editor.moveToEndOfLine()
          editor.insertText('\n')
          editor.moveToBeginningOfLine()
        }
      }, 200 * i)
    }
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  shiftAndPrintRow() {
    const { editor } = this
    if (this.rows.length < 1)  { atom.notifications.addWarning('Ooops... no rows were found'); return }
    const row = this.rows.shift()
    editor.moveToBeginningOfLine()
    this.printRowContent(row, editor)
  },

  toggle() {
    console.log('CodePlayer was toggled!')

    if ((this.editor = editor = atom.workspace.getActiveTextEditor())) {
      this.storeOriginalSelectionAndEmptyPane()
      this.preparePresentation()
      this.shiftAndPrintRow()

      console.log('DONE')
    }
  }
}
