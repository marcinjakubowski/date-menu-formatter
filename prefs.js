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

/* 
    Swaths of pref related code borrowed from Clipboard Indicator, an amazing extension
    https://github.com/Tudmotu/gnome-shell-extension-clipboard-indicator
    https://extensions.gnome.org/extension/779/clipboard-indicator/
*/
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk?version=4.0'

import {
  ExtensionPreferences,
  gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

import { default as FORMATTER, help } from './formatters/01_luxon.js'

import * as prefFields from './utils/prefFields.js'
import {
  getCurrentCalendar,
  getCurrentTimezone,
  getCurrentLocale,
} from './utils/general.js'
import { useAddRow, createLabel, addBox, table, a, b } from './utils/markup.js'
import { FormatterManager } from './utils/formatter.js'

class Preferences {
  constructor(settings) {
    this.settings = settings
    this.formatters = new FormatterManager()
    this.initUI()
    this.formatters
      .loadFormatters()
      .then(() => {
        this.createUI()
        this.generatePreview()
      })
      .catch((e) => {
        console.error('Date Menu Formatter error:', e)
      })
  }

  initUI() {
    this.main = new Gtk.Grid({
      margin_top: 10,
      margin_bottom: 10,
      margin_start: 10,
      margin_end: 10,
      row_spacing: 12,
      column_spacing: 18,
      column_homogeneous: false,
      row_homogeneous: false,
    })
    this._previewErrorCount = 0
    this.addRow = useAddRow(this.main)
    this.addSeparator = () => this.addRow(null, new Gtk.Separator())
  }

  createUI() {
    this.UIcreatePatternSetting()
    this.UIcreatePatternPreview()
    this.addSeparator()
    this.UIcreateDefaultLocaleSetting()
    this.UIcreateRemoveUnreadMessagesSetting()
    this.UIcreateAllPanelsSetting()
    this.UIcreateFontSizeSetting()
    this.addSeparator()
    this.UIcreateFormatterHelp()
  }

  UIcreatePatternSetting() {
    const patternEdit = new Gtk.Entry({ buffer: new Gtk.EntryBuffer() })

    this.addRow(createLabel(_('Pattern')), patternEdit)
    this._pattern = patternEdit.buffer

    this.settings.bind(
      prefFields.PATTERN,
      patternEdit.buffer,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    )
    patternEdit.buffer.connect_after(
      'inserted-text',
      this.generatePreview.bind(this)
    )
    patternEdit.buffer.connect_after(
      'deleted-text',
      this.generatePreview.bind(this)
    )
  }

  UIcreatePatternPreview() {
    this._preview = createLabel('')
    this.addRow(createLabel(_('Preview')), this._preview)
  }

  UIcreateDefaultLocaleSetting() {
    const localeBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 30,
    })
    const useDefaultLocaleEdit = new Gtk.Switch({
      vexpand: false,
      valign: Gtk.Align.CENTER,
    })
    const customLocaleEdit = new Gtk.Entry({ buffer: new Gtk.EntryBuffer() })
    addBox(localeBox, useDefaultLocaleEdit)
    addBox(localeBox, customLocaleEdit)

    this.addRow(
      createLabel(_('Use default locale') + ` (${getCurrentLocale()})`),
      localeBox
    )
    this._customLocale = customLocaleEdit.buffer
    this._useDefaultLocale = useDefaultLocaleEdit

    this.settings.bind(
      prefFields.USE_DEFAULT_LOCALE,
      useDefaultLocaleEdit,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    )

    this.settings.bind(
      prefFields.USE_DEFAULT_LOCALE,
      customLocaleEdit,
      'sensitive',
      Gio.SettingsBindFlags.GET |
        Gio.SettingsBindFlags.NO_SENSITIVITY |
        Gio.SettingsBindFlags.INVERT_BOOLEAN
    )

    this.settings.bind(
      prefFields.CUSTOM_LOCALE,
      customLocaleEdit.buffer,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    )

    useDefaultLocaleEdit.connect('state-set', this.generatePreview.bind(this))
    customLocaleEdit.buffer.connect_after(
      'inserted-text',
      this.generatePreview.bind(this)
    )
    customLocaleEdit.buffer.connect_after(
      'deleted-text',
      this.generatePreview.bind(this)
    )
  }

  UIcreateRemoveUnreadMessagesSetting() {
    const removeMessagesIndicatorEdit = new Gtk.Switch()
    this.addRow(
      createLabel(_('Remove unread messages indicator')),
      removeMessagesIndicatorEdit
    )

    this.settings.bind(
      prefFields.REMOVE_MESSAGES_INDICATOR,
      removeMessagesIndicatorEdit,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    )
  }

  UIcreateAllPanelsSetting() {
    const applyAllPanelsEdit = new Gtk.Switch()

    this.addRow(
      createLabel(_('Apply to all panels (Dash to Panel)')),
      applyAllPanelsEdit
    )
    this.settings.bind(
      prefFields.APPLY_ALL_PANELS,
      applyAllPanelsEdit,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    )
  }

  UIcreateFontSizeSetting() {
    const fontSizeEdit = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 4,
        upper: 30,
        step_increment: 1,
      }),
    })

    this.addRow(createLabel(_('Font size')), fontSizeEdit)

    fontSizeEdit.connect(
      'output',
      function (spin) {
        spin.text = `${spin.value} pt`
        return true
      }.bind(this)
    )
    this.settings.bind(
      prefFields.FONT_SIZE,
      fontSizeEdit,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    )
  }

  UIcreateFormatterHelp() {
    const left = createLabel('')
    left.set_markup(`${b('Available pattern components')}${table(help.left)}`)

    const right = createLabel('')
    right.set_markup(`${a(help.link, 'Full list (web)')}${table(help.right)}`)

    this.addRow(left, right)
  }

  generatePreview() {
    const locale = this._useDefaultLocale.active
      ? getCurrentLocale()
      : this._customLocale.text
    const calendar = this._useDefaultCalendar.active
      ? getCurrentCalendar()
      : this._customCalendar.active_id
    const timezone = this._useDefaultTimezone.active
      ? getCurrentTimezone()
      : this._customTimezone.text

    if (this._pattern.text.length > 1) {
      try {
        this._preview.label = new FORMATTER(timezone, locale, calendar).format(
          this._pattern.text,
          new Date()
        )
        this._previewErrorCount = 0
      } catch (e) {
        this._previewErrorCount++
        if (this._previewErrorCount > 2) {
          this._preview.label = 'ERROR: ' + e.message
        }
      }
    } else {
      this._preview.label = ''
      this._previewErrorCount = 0
    }
  }
}

export default class DateMenuFormatterPreferences extends ExtensionPreferences {
  getPreferencesWidget() {
    const frame = new Gtk.Box()
    const widget = new Preferences(this.getSettings())
    addBox(frame, widget.main)
    if (frame.show_all) frame.show_all()
    return frame
  }
}
