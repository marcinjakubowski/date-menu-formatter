/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const { GLib, Clutter, St } = imports.gi
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Utils = Me.imports.utils
const Main = imports.ui.main
const MainPanel = Main.panel
const Formatters = Me.imports.formatters

let PATTERN = ''
let USE_DEFAULT_LOCALE = true
let USE_DEFAULT_TIMEZONE = true
let CUSTOM_LOCALE = ''
let CUSTOM_TIMEZONE = ''
let REMOVE_MESSAGES_INDICATOR = false
let APPLY_ALL_PANELS = false
let FONT_SIZE = 1
let EVERY = Utils.updateLevel()

function _getDateMenuButton(panel) {
  return panel.statusArea.dateMenu.get_children()[0]
}

class Extension {
  constructor() {
    this._displays = [this._createDisplay()]
    this._timerId = -1
    this._settingsChangedId = null
    this._dashToPanelConnection = null
    this._formatter = null
    this._update = true
  }

  _createDisplay() {
    const display = new St.Label({
      style_class: 'clock',
      style: 'font-size: 9pt; text-align: center',
    })
    display.clutter_text.x_align = Clutter.ActorAlign.CENTER
    display.clutter_text.y_align = Clutter.ActorAlign.CENTER
    display.text = '...'
    return display
  }

  _loadSettings() {
    this._settings = ExtensionUtils.getSettings()
    this._settingsChangedId = this._settings.connect('changed', () =>
      this._onSettingsChange()
    )
    this._onSettingsChange()
  }

  _fetchSettings() {
    PATTERN = this._settings.get_string(Utils.PrefFields.PATTERN)

    REMOVE_MESSAGES_INDICATOR = this._settings.get_boolean(
      Utils.PrefFields.REMOVE_MESSAGES_INDICATOR
    )
    USE_DEFAULT_LOCALE = this._settings.get_boolean(
      Utils.PrefFields.USE_DEFAULT_LOCALE
    )
    CUSTOM_LOCALE = this._settings.get_string(Utils.PrefFields.CUSTOM_LOCALE)
    USE_DEFAULT_TIMEZONE = this._settings.get_boolean(
      Utils.PrefFields.USE_DEFAULT_TIMEZONE
    )
    CUSTOM_TIMEZONE = this._settings.get_string(
      Utils.PrefFields.CUSTOM_TIMEZONE
    )
    APPLY_ALL_PANELS = this._settings.get_boolean(
      Utils.PrefFields.APPLY_ALL_PANELS
    )
    FONT_SIZE = this._settings.get_int(Utils.PrefFields.FONT_SIZE)

    const curLvl = this._settings.get_int(Utils.PrefFields.UPDATE_LEVEL)
    if (EVERY.lvl !== curLvl) {
      EVERY = Utils.updateLevel(curLvl)
      if (this._timerId !== -1) this.restart()
    }

    const locale = USE_DEFAULT_LOCALE ? Utils.getCurrentLocale() : CUSTOM_LOCALE
    const timezone = USE_DEFAULT_TIMEZONE
      ? Utils.getCurrentTimezone()
      : CUSTOM_TIMEZONE

    const formatter = this._settings.get_string(Utils.PrefFields.FORMATTER)
    this._formatter = new Formatters[formatter].Formatter(timezone, locale)
  }

  _removeIndicator(panels) {
    panels.forEach((panel) => {
      if (panel.statusArea.dateMenu._indicator.get_parent())
        _getDateMenuButton(panel).remove_child(
          panel.statusArea.dateMenu._indicator
        )
    })
  }

  _restoreIndicator(panels) {
    panels.forEach((panel) => {
      if (!panel.statusArea.dateMenu._indicator.get_parent())
        _getDateMenuButton(panel).insert_child_at_index(
          panel.statusArea.dateMenu._indicator,
          2
        )
    })
  }

  // returns affected and unaffected panels based on settings and Dash To Panel availability
  _getPanels() {
    if (!global.dashToPanel) return [[MainPanel], []]
    else if (APPLY_ALL_PANELS) {
      return [global.dashToPanel.panels, []]
    } else {
      // MainPanel is not the same as primary Dash To Panel panel, but their dateMenus are the same
      return [
        [MainPanel],
        global.dashToPanel.panels.filter(
          (panel) => panel.statusArea.dateMenu != MainPanel.statusArea.dateMenu
        ),
      ]
    }
  }

  _enableOn(panels) {
    panels.forEach((panel, idx) => {
      const dateMenuButton = _getDateMenuButton(panel)
      if (!this._displays[idx].get_parent()) {
        dateMenuButton.insert_child_at_index(this._displays[idx], 1)
        dateMenuButton.dateMenuFormatterDisplay = this._displays[idx]
      }
      if (panel.statusArea.dateMenu._clockDisplay.get_parent()) {
        dateMenuButton.remove_child(panel.statusArea.dateMenu._clockDisplay)
      }
    })
  }

  _disableOn(panels) {
    panels.forEach((panel) => {
      const dateMenuButton = _getDateMenuButton(panel)
      if (!panel.statusArea.dateMenu._clockDisplay.get_parent()) {
        dateMenuButton.insert_child_at_index(
          panel.statusArea.dateMenu._clockDisplay,
          1
        )
      }
      if (
        dateMenuButton.dateMenuFormatterDisplay &&
        dateMenuButton.dateMenuFormatterDisplay.get_parent()
      ) {
        dateMenuButton.remove_child(dateMenuButton.dateMenuFormatterDisplay)
      }
    })
  }

  _onSettingsChange() {
    this._fetchSettings()
    // does Dash to Panel support more than 2 panels? better to be safe than sorry
    if (
      global.dashToPanel &&
      this._displays.length < global.dashToPanel.panels.length
    ) {
      const missingPanels =
        global.dashToPanel.panels.length - this._displays.length
      this._displays = [
        ...this._displays,
        ...Array.from({ length: missingPanels }, () => this._createDisplay()),
      ]
    }

    const [affectedPanels, unaffectedPanels] = this._getPanels()
    if (REMOVE_MESSAGES_INDICATOR) {
      this._removeIndicator(affectedPanels)
      this._restoreIndicator(unaffectedPanels)
    } else {
      this._restoreIndicator([...affectedPanels, ...unaffectedPanels])
    }
    this._enableOn(affectedPanels)
    this._disableOn(unaffectedPanels)
    this._displays.forEach(
      (display) =>
        (display.style = `font-size: ${FONT_SIZE}pt; text-align: center`)
    )
  }

  enable() {
    if (global.dashToPanel) {
      this._dashToPanelConnection = global.dashToPanel.connect(
        'panels-created',
        () => this._onSettingsChange()
      )
    }
    this._loadSettings()
    const [affectedPanels, _] = this._getPanels()
    this._enableOn(affectedPanels)
    this.start()
  }
  start() {
    this._update = true
    this._timerId = GLib.timeout_add(EVERY.priority, EVERY.timeout, () =>
      this.update()
    )
    this.update()
  }
  stop(force) {
    if (force) {
      GLib.Source.remove(this._timerId)
    } else {
      this._update = false
    }
  }
  restart() {
    this.stop(true)
    this.start()
  }
  update() {
    const setText = (text) =>
      this._displays.forEach((display) => (display.text = text))
    try {
      setText(this._formatter.format(PATTERN, new Date()))
    } catch (e) {
      // if there is an exception during formatting, use the default display's text
      setText(MainPanel.statusArea.dateMenu._clockDisplay.text)
      log('DateMenuFormatter: ' + e.message)
    }
    return this._update
  }

  disable() {
    const [affectedPanels, unaffectedPanels] = this._getPanels()
    const allPanels = [...affectedPanels, ...unaffectedPanels]
    this._disableOn(allPanels)
    this._restoreIndicator(allPanels)
    this.stop()
    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId)
      this._settingsChangedId = null
    }
    if (this._dashToPanelConnection) {
      global.dashToPanel.disconnect(this._dashToPanelConnection)
      this._dashToPanelConnection = null
    }
    this._settings = null
  }
}

function init() {
  return new Extension()
}
