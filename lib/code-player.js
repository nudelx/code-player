'use babel'
import CodePlayerView from './code-player-view'
import { CompositeDisposable, Emitter } from 'atom'

export default {
  codePlayerView: null,
  modalPanel: null,
  subscriptions: null,
  config: {
    TypingSpeed: {
      type: 'integer',
      description: 'typing speed value in milliseconds',
      default: 200
    },
    AutoRowPlay: {
      type: 'boolean',
      description: 'if checked will automaticaly play all rows till the end, otherwise will wait key press per each row ',
      default: true
    }
  },

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
        'code-player:toggle': () => this.toggle(),
        'code-player:reset': () => this.reset(),
        'code-player:continue': () => this.continue()
      })
    )

    this.rowEvent = new Emitter()
    this.rowEvent.on('rowFinished', () => {
      // console.log('new row!!!')
      this.shiftAndPrintRow(editor)
    })

    this.interuptAll = false
    this.running = false
    this.interupt = new Emitter()
    this.interupt.on('interruptAll', () => {
      this.interuptAll = true
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
    this.original = this.original ? this.original : selection
    editor.delete()
  },

  setBracketMatcher(value) {
    if (atom.config.defaultSettings.hasOwnProperty('bracket-matcher')) {
      atom.config.defaultSettings[
        'bracket-matcher'
      ].autocompleteBrackets = value
    }
  },

  preparePresentation() {
    this.setBracketMatcher(false)
    this.rows = this.original.split('\n')
    if (this.rows.length < 1)
      atom.notifications.addWarning('No rows were found')
  },

  emitAndNewRow() {
    if (this.configuration.AutoRowPlay) {
      this.rowEvent.emit('rowFinished')
    } else {
      this.running = false
    }
    editor.moveToEndOfLine()
    editor.insertText('\n')
    editor.moveToBeginningOfLine()

  },

  printRowContent(row, editor, rowIndex) {
    const self = this
    const letters = row.split('')
    const timersRunning = {}
    // console.log('new row', row)
    if (!row) this.emitAndNewRow()

    for (let i = 0; i < letters.length; i++) {
      // inorder to avoid async behavior and adding emitter
      if (this.interuptAll) {
        this.running = false
        return
      }
      timersRunning[i] = setTimeout(function() {
        editor.insertText(letters[i])
        delete timersRunning[i]
        if (!Object.keys(timersRunning).length) {
          self.emitAndNewRow()
        }
      }, self.configuration.TypingSpeed * i)
    }
  },

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  shiftAndPrintRow() {
    console.log(this)
    const { editor } = this
    if (this.rows.length < 1) {
      atom.notifications.addSuccess('Done')
      this.setBracketMatcher(true)
      this.subscribeOrUnsubscribeOnKeyPress(true)
      this.running = this.interruptAll = false
      return
    }
    const row = this.rows.shift()
    editor.moveToBeginningOfLine()
    this.printRowContent(row, editor)
  },

  spaceClick( event ) {
    console.log('event', event)
    event.preventDefault()
    event.stopPropagation()
    this.rowEvent.emit('rowFinished')
  },

  subscribeOrUnsubscribeOnKeyPress (unsubscribe) {
    const { editor } = this
    const view = atom.views.getView(editor)
    if (unsubscribe) {
      view.removeEventListener('keydown', this.spaceClick.bind(this))
      return
    }
    view.addEventListener('keydown', this.spaceClick.bind(this))

  },

  toggle() {
    if (this.running) {
      atom.notifications.addWarning(
        'Interrupt Accepted: Waiting to stop the row printing ...'
      )
      this.interupt.emit('interruptAll')
      return
    }

    if ((this.editor = editor = atom.workspace.getActiveTextEditor())) {
      this.running = true
      this.configuration = atom.config.get('code-player') || {
        TypingSpeed: 200
      }
      this.storeOriginalSelectionAndEmptyPane()
      this.preparePresentation()
      this.subscribeOrUnsubscribeOnKeyPress()
      this.shiftAndPrintRow()
    }
  },

  continue() {
    if (this.interuptAll) {
      this.interuptAll = false
      this.running = true
      this.shiftAndPrintRow()
      return
    } else {
      atom.notifications.addWarning('Plugin is running')
    }
  },

  reset() {
    if (this.running) {
      atom.notifications.addWarning('Plugin is running')
      return
    }
    this.setBracketMatcher(true)
    this.subscribeOrUnsubscribeOnKeyPress(true)
    editor.selectAll()
    editor.delete()
    this.editor.insertText(this.original)
    atom.notifications.addSuccess('Reset')
    this.running = false
    this.interuptAll = false
  }
}
