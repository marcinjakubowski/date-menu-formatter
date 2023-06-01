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
const Gtk = imports.gi.Gtk
const Gio = imports.gi.Gio
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const Utils = Me.imports.utils
const { a, b, table } = Utils
const Formatters = Me.imports.formatters
const Gettext = imports.gettext
const _ = Gettext.domain('date-menu-formatter').gettext

const FormatterList = Object.keys(Formatters)
  .filter((f) => !f.startsWith('_'))
  .map((f) => ({
    key: f,
    name: Formatters[f].Formatter.fName,
    description: Formatters[f].Formatter.description,
  }))

function init() {
  let localeDir = Me.dir.get_child('locale')
  if (localeDir.query_exists(null))
    Gettext.bindtextdomain('date-menu-formatter', localeDir.get_path())
}

function addBox(box, child) {
  if (imports.gi.versions.Gtk.startsWith('3')) {
    box.add(child)
  } else {
    box.append(child)
  }
}

class Preferences {
  constructor() {
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
    const settings = ExtensionUtils.getSettings()
    const addRow = ((main) => {
      let row = 0
      return (label, input) => {
        let inputWidget = input

        if (input instanceof Gtk.Switch) {
          inputWidget = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL })
          addBox(inputWidget, input)
        }

        if (label) {
          main.attach(label, 0, row, 1, 1)
          if (inputWidget) main.attach(inputWidget, 1, row, 1, 1)
        } else {
          main.attach(inputWidget, 0, row, 2, 1)
        }

        row++
      }
    })(this.main)

    const createLabel = (label) => {
      return new Gtk.Label({
        label: label,
        hexpand: true,
        halign: Gtk.Align.START,
      })
    }

    const formatterLabel = createLabel(_('Formatter'))
    const formatterSelect = new Gtk.ComboBoxText({
      hexpand: true,
      halign: Gtk.Align.FILL,
    })

    FormatterList.forEach(({ key, name }) => {
      formatterSelect.append(key, name)
    })

    formatterSelect.set_active_id(
      settings.get_string(Utils.PrefFields.FORMATTER)
    )
    this._formatter = formatterSelect

    const patternLabel = createLabel(_('Pattern'))
    const patternEdit = new Gtk.Entry({ buffer: new Gtk.EntryBuffer() })

    const previewLabel = createLabel(_('Preview'))
    const patternPreview = createLabel('')

    const updateLevelLabel = createLabel(_('Update'))
    const updateLevelSelect = new Gtk.ComboBoxText({
      hexpand: true,
      halign: Gtk.Align.FILL,
    })

    for (let i = 0; i <= 15; i++) {
      updateLevelSelect.append('' + i, Utils.updateLevelToString(i))
    }
    updateLevelSelect.set_active_id(
      '' + settings.get_int(Utils.PrefFields.UPDATE_LEVEL)
    )

    const useDefaultLocaleLabel = createLabel(
      _('Use default locale') + ` (${Utils.getCurrentLocale()})`
    )
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
    if (!Formatters[formatterSelect.active_id].Formatter.can.customLocale) {
      localeBox.hide()
      useDefaultLocaleLabel.hide()
    }

    const useDefaultTimezoneLabel = createLabel(
      _('Use default timezone') + ` (${Utils.getCurrentTimezone()})`
    )
    const timezoneBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 30,
    })
    const useDefaultTimezoneEdit = new Gtk.Switch({
      vexpand: false,
      valign: Gtk.Align.CENTER,
    })

    const customTimezoneEdit = new Gtk.Entry({ buffer: new Gtk.EntryBuffer() })

    addBox(timezoneBox, useDefaultTimezoneEdit)
    addBox(timezoneBox, customTimezoneEdit)
    if (!Formatters[formatterSelect.active_id].Formatter.can.customTimezone) {
      timezoneBox.hide()
      useDefaultTimezoneLabel.hide()
    }

    const removeMessagesIndicatorLabel = createLabel(
      _('Remove unread messages indicator')
    )
    const removeMessagesIndicatorEdit = new Gtk.Switch()

    const fontSizeLabel = createLabel(_('Font size'))
    const fontSizeEdit = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 4,
        upper: 30,
        step_increment: 1,
      }),
    })

    fontSizeEdit.connect(
      'output',
      function (spin) {
        spin.text = `${spin.value} pt`
        return true
      }.bind(this)
    )

    const applyAllPanelsLabel = createLabel(
      _('Apply to all panels (Dash to Panel)')
    )
    const applyAllPanelsEdit = new Gtk.Switch()

    addRow(formatterLabel, formatterSelect)
    addRow(patternLabel, previewLabel)
    addRow(patternEdit, patternPreview)
    addRow(updateLevelLabel, updateLevelSelect)
    addRow(useDefaultLocaleLabel, localeBox)
    addRow(useDefaultTimezoneLabel, timezoneBox)
    addRow(removeMessagesIndicatorLabel, removeMessagesIndicatorEdit)
    addRow(applyAllPanelsLabel, applyAllPanelsEdit)
    addRow(fontSizeLabel, fontSizeEdit)
    addRow(null, new Gtk.Separator())

    const help1 = createLabel('')
    const help2 = createLabel('')

    this.setHelp(help1, help2)

    addRow(help1, help2)

    settings.bind(
      Utils.PrefFields.FORMATTER,
      formatterSelect,
      'active-id',
      Gio.SettingsBindFlags.DEFAULT
    )
    settings.bind(
      Utils.PrefFields.PATTERN,
      patternEdit.buffer,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    )
    settings.bind(
      Utils.PrefFields.USE_DEFAULT_LOCALE,
      useDefaultLocaleEdit,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    )
    settings.bind(
      Utils.PrefFields.CUSTOM_LOCALE,
      customLocaleEdit.buffer,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    )
    settings.bind(
      Utils.PrefFields.USE_DEFAULT_TIMEZONE,
      useDefaultTimezoneEdit,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    )
    settings.bind(
      Utils.PrefFields.CUSTOM_TIMEZONE,
      customTimezoneEdit.buffer,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    )
    settings.bind(
      Utils.PrefFields.REMOVE_MESSAGES_INDICATOR,
      removeMessagesIndicatorEdit,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    )
    settings.bind(
      Utils.PrefFields.APPLY_ALL_PANELS,
      applyAllPanelsEdit,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    )
    settings.bind(
      Utils.PrefFields.FONT_SIZE,
      fontSizeEdit,
      'value',
      Gio.SettingsBindFlags.DEFAULT
    )
    const sensitivityBindFlags =
      Gio.SettingsBindFlags.GET |
      Gio.SettingsBindFlags.NO_SENSITIVITY |
      Gio.SettingsBindFlags.INVERT_BOOLEAN
    settings.bind(
      Utils.PrefFields.USE_DEFAULT_LOCALE,
      customLocaleEdit,
      'sensitive',
      sensitivityBindFlags
    )
    settings.bind(
      Utils.PrefFields.USE_DEFAULT_TIMEZONE,
      customTimezoneEdit,
      'sensitive',
      sensitivityBindFlags
    )

    useDefaultLocaleEdit.connect('state-set', this.generatePreview.bind(this))
    useDefaultTimezoneEdit.connect('state-set', this.generatePreview.bind(this))

    customLocaleEdit.buffer.connect_after(
      'inserted-text',
      this.generatePreview.bind(this)
    )
    customLocaleEdit.buffer.connect_after(
      'deleted-text',
      this.generatePreview.bind(this)
    )
    customTimezoneEdit.buffer.connect_after(
      'inserted-text',
      this.generatePreview.bind(this)
    )
    customTimezoneEdit.buffer.connect_after(
      'deleted-text',
      this.generatePreview.bind(this)
    )
    patternEdit.buffer.connect_after(
      'inserted-text',
      this.generatePreview.bind(this)
    )
    patternEdit.buffer.connect_after(
      'deleted-text',
      this.generatePreview.bind(this)
    )
    updateLevelSelect.connect('changed', () => {
      settings.set_int(
        Utils.PrefFields.UPDATE_LEVEL,
        parseInt(updateLevelSelect.active_id)
      )
    })
    formatterSelect.connect('changed', () => {
      this.setHelp(help1, help2)
      if (Formatters[formatterSelect.active_id].Formatter.can.customLocale) {
        localeBox.show()
        useDefaultLocaleLabel.show()
      } else {
        localeBox.hide()
        useDefaultLocaleLabel.hide()
      }
      if (Formatters[formatterSelect.active_id].Formatter.can.customTimezone) {
        timezoneBox.show()
        useDefaultTimezoneLabel.show()
      } else {
        timezoneBox.hide()
        useDefaultTimezoneLabel.hide()
      }
      this.generatePreview()
    })

    this._pattern = patternEdit.buffer
    this._preview = patternPreview
    this._customLocale = customLocaleEdit.buffer
    this._customTimezone = customTimezoneEdit.buffer
    this._useDefaultLocale = useDefaultLocaleEdit
    this._useDefaultTimezone = useDefaultTimezoneEdit
    this._previewErrorCount = 0
    this.generatePreview()
  }

  setHelp(left, right) {
    const help = Formatters[this._formatter.active_id].help
    left.set_markup(`${b('Available pattern components')}${table(help.left)}`)
    right.set_markup(`${a(help.link, 'Full list (web)')}${table(help.right)}`)
  }

  generatePreview() {
    const locale = this._useDefaultLocale.active
      ? Utils.getCurrentLocale()
      : this._customLocale.text
    const timezone = this._useDefaultTimezone.active
      ? Utils.getCurrentTimezone()
      : this._customTimezone.text
    const formatter = this._formatter.active_id
    if (this._pattern.text.length > 1) {
      try {
        this._preview.label = new Formatters[formatter].Formatter(
          timezone,
          locale
        ).format(this._pattern.text, new Date())
        this._previewErrorCount = 0
      } catch (e) {
        this._previewErrorCount++
        if (this._previewErrorCount > 2) {
          if (e.message !== 'fmtFn is not a function')
            this._preview.label = 'ERROR: ' + e.message
          else this._preview.label = 'ERROR'
        }
      }
    } else {
      this._preview.label = ''
      this._previewErrorCount = 0
    }
  }
}

function buildPrefsWidget() {
  let frame = new Gtk.Box()
  let widget = new Preferences()
  addBox(frame, widget.main)
  if (frame.show_all) frame.show_all()
  return frame
}
