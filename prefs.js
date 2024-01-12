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
import Adw from 'gi://Adw'

import {
  ExtensionPreferences,
  gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

import * as prefFields from './utils/prefFields.js'
import {
  getCurrentCalendar,
  getCurrentTimezone,
  getCurrentLocale,
  updateLevelToString,
  TEXT_ALIGN_START,
  TEXT_ALIGN_CENTER,
  TEXT_ALIGN_END,
} from './utils/general.js'
import { useAddRow, createLabel, addBox, table, a, b } from './utils/markup.js'
import { CALENDAR_LIST, FormatterManager } from './utils/formatter.js'

class Preferences {
  constructor(settings) {
    this.settings = settings
    this.formatters = new FormatterManager()
    this._previewErrorCount = 0
    this.box = {}
    this.initUI()
    this.formatters
      .loadFormatters()
      .then(() => {
        this.createUI()
        this.UIShowHideFormatterAbility(
          this.formatters.getFormatter(this._formatter.active_id).can
        )
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
    this.addRow = useAddRow(this.main)
    this.addSeparator = () => this.addRow(null, new Gtk.Separator())
  }

  createUI() {
    this.UIcreateFormatterSetting()
    this.UIcreateFontSizeSetting()
    this.UIcreateTextAlignSetting()
    this.UIcreatePatternSetting()
    this.UIcreatePatternPreview()
    this.addSeparator()
    this.UIcreateUpdateLevelSetting()
    this.UIcreateDefaultLocaleSetting()
    this.UIcreateDefaultCalendarSetting()
    this.UIcreateDefaultTimezoneSetting()
    this.addSeparator()
    this.UIcreateRemoveUnreadMessagesSetting()
    this.UIcreateAllPanelsSetting()
    this.addSeparator()
    this.UIcreateFormatterHelp()
  }

  UIcreateFormatterSetting() {
    const formatterSelect = new Gtk.ComboBoxText({
      hexpand: true,
      halign: Gtk.Align.FILL,
    })

    this.formatters.asList().forEach(({ key, name }) => {
      formatterSelect.append(key, name)
    })

    formatterSelect.set_active_id(
      this.settings.get_string(prefFields.FORMATTER)
    )
    this._formatter = formatterSelect
    this.addRow(createLabel(_('Formatter')), formatterSelect)

    this.settings.bind(
      prefFields.FORMATTER,
      formatterSelect,
      'active-id',
      Gio.SettingsBindFlags.DEFAULT
    )
    formatterSelect.connect('changed', () => {
      this.setHelpMarkup(
        this.formatters.getFormatterHelp(this._formatter.active_id)
      )
      this.UIShowHideFormatterAbility(
        this.formatters.getFormatter(this._formatter.active_id).can
      )
      this.generatePreview()
    })
  }

  UIShowHideFormatterAbility(can) {
    this.box.locale(can.customLocale)
    this.box.calendar(can.customCalendar)
    this.box.timezone(can.customTimezone)
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
    this._preview.set_use_markup(true)
    this.addRow(createLabel(_('Preview')), this._preview)
  }

  UIcreateUpdateLevelSetting() {
    const updateLevelSelect = new Gtk.ComboBoxText({
      hexpand: true,
      halign: Gtk.Align.FILL,
    })

    for (let i = 0; i <= 15; i++) {
      updateLevelSelect.append('' + i, updateLevelToString(i))
    }
    updateLevelSelect.set_active_id(
      '' + this.settings.get_int(prefFields.UPDATE_LEVEL)
    )
    this.addRow(createLabel(_('Update')), updateLevelSelect)

    updateLevelSelect.connect('changed', () => {
      this.settings.set_int(
        prefFields.UPDATE_LEVEL,
        parseInt(updateLevelSelect.active_id)
      )
    })
  }

  UIcreateDefaultLocaleSetting() {
    const useDefaultLocaleLabel = createLabel(
      _('Use default locale') + ` (${getCurrentLocale()})`
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

    this.addRow(useDefaultLocaleLabel, localeBox)

    this.box.locale = (show) => {
      if (show) {
        localeBox.show()
        useDefaultLocaleLabel.show()
      } else {
        localeBox.hide()
        useDefaultLocaleLabel.hide()
      }
    }
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
  UIcreateDefaultCalendarSetting() {
    const defaultCalendarName = CALENDAR_LIST.find(
      ({ key }) => key === getCurrentCalendar()
    ).name

    const useDefaultCalendarLabel = createLabel(
      _('Use default calendar') + ` (${defaultCalendarName})`
    )
    const calendarBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 30,
    })
    const useDefaultCalendarEdit = new Gtk.Switch({
      vexpand: false,
      valign: Gtk.Align.CENTER,
    })
    const customCalendarSelect = new Gtk.ComboBoxText({
      hexpand: false,
      halign: Gtk.Align.FILL,
    })

    CALENDAR_LIST.forEach(({ key, name, description }) => {
      customCalendarSelect.append(key, `${name} -> "${description}"`)
    })

    customCalendarSelect.set_active_id(
      this.settings.get_string(prefFields.CUSTOM_CALENDAR) ||
        getCurrentCalendar()
    )

    addBox(calendarBox, useDefaultCalendarEdit)
    addBox(calendarBox, customCalendarSelect)

    this.addRow(useDefaultCalendarLabel, calendarBox)

    this.box.calendar = (show) => {
      if (show) {
        calendarBox.show()
        useDefaultCalendarLabel.show()
      } else {
        calendarBox.hide()
        useDefaultCalendarLabel.hide()
      }
    }
    this._customCalendar = customCalendarSelect
    this._useDefaultCalendar = useDefaultCalendarEdit

    this.settings.bind(
      prefFields.USE_DEFAULT_CALENDAR,
      useDefaultCalendarEdit,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    )
    this.settings.bind(
      prefFields.CUSTOM_CALENDAR,
      customCalendarSelect,
      'active-id',
      Gio.SettingsBindFlags.DEFAULT
    )
    this.settings.bind(
      prefFields.USE_DEFAULT_CALENDAR,
      customCalendarSelect,
      'sensitive',
      Gio.SettingsBindFlags.GET |
        Gio.SettingsBindFlags.NO_SENSITIVITY |
        Gio.SettingsBindFlags.INVERT_BOOLEAN
    )
    useDefaultCalendarEdit.connect('state-set', this.generatePreview.bind(this))
    customCalendarSelect.connect('changed', this.generatePreview.bind(this))
  }

  UIcreateDefaultTimezoneSetting() {
    const useDefaultTimezoneLabel = createLabel(
      _('Use default timezone') + ` (${getCurrentTimezone()})`
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

    this.addRow(useDefaultTimezoneLabel, timezoneBox)

    this.box.timezone = (show) => {
      if (show) {
        timezoneBox.show()
        useDefaultTimezoneLabel.show()
      } else {
        timezoneBox.hide()
        useDefaultTimezoneLabel.hide()
      }
    }
    this._customTimezone = customTimezoneEdit.buffer
    this._useDefaultTimezone = useDefaultTimezoneEdit

    this.settings.bind(
      prefFields.USE_DEFAULT_TIMEZONE,
      useDefaultTimezoneEdit,
      'active',
      Gio.SettingsBindFlags.DEFAULT
    )
    this.settings.bind(
      prefFields.CUSTOM_TIMEZONE,
      customTimezoneEdit.buffer,
      'text',
      Gio.SettingsBindFlags.DEFAULT
    )
    this.settings.bind(
      prefFields.USE_DEFAULT_TIMEZONE,
      customTimezoneEdit,
      'sensitive',
      Gio.SettingsBindFlags.GET |
        Gio.SettingsBindFlags.NO_SENSITIVITY |
        Gio.SettingsBindFlags.INVERT_BOOLEAN
    )

    useDefaultTimezoneEdit.connect('state-set', this.generatePreview.bind(this))

    customTimezoneEdit.buffer.connect_after(
      'inserted-text',
      this.generatePreview.bind(this)
    )
    customTimezoneEdit.buffer.connect_after(
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
        this.FONT_SIZE = spin.value
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
  UIcreateTextAlignSetting() {
    const tAlignBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 0,
    })
    tAlignBox.set_css_classes(['linked'])

    const buttons = [
      {
        btn: Gtk.Button.new_from_icon_name('format-justify-left-symbolic'),
        key: TEXT_ALIGN_START,
      },
      {
        btn: Gtk.Button.new_from_icon_name('format-justify-center-symbolic'),
        key: TEXT_ALIGN_CENTER,
      },
      {
        btn: Gtk.Button.new_from_icon_name('format-justify-right-symbolic'),
        key: TEXT_ALIGN_END,
      },
    ]
    const settings = this.settings
    const selected = {
      get value() {
        return settings.get_string(prefFields.TEXT_ALIGN)
      },
      set value(sel) {
        buttons.forEach(({ btn, key }) => {
          btn.set_sensitive(key !== sel)
        })
        settings.set_string(prefFields.TEXT_ALIGN, sel)
      },
    }
    selected.value = selected.value || TEXT_ALIGN_CENTER
    buttons.forEach(({ btn, key }) => {
      addBox(tAlignBox, btn)
      btn.connect('clicked', function () {
        selected.value = key
      })
    })

    this.addRow(createLabel(_('Align Text')), tAlignBox)
  }

  UIcreateFormatterHelp() {
    const left = createLabel('')
    const right = createLabel('')

    this.setHelpMarkup = (help) => {
      left.set_markup(`${b('Available pattern components')}${table(help.left)}`)
      right.set_markup(`${a(help.link, 'Full list (web)')}${table(help.right)}`)
    }

    this.setHelpMarkup(
      this.formatters.getFormatterHelp(this._formatter.active_id)
    )

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
        const formatter = this.formatters.getFormatter(
          this._formatter.active_id
        )
        this._preview.label = new formatter(timezone, locale, calendar).format(
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
  fillPreferencesWindow(window) {
    window._settings = this.getSettings()
    window.set_size_request(1000, 700)
    const page = new Adw.PreferencesPage()

    const group = new Adw.PreferencesGroup({
      title: _('General'),
    })
    group.add(this.getPreferencesWidget())
    page.add(group)
    window.add(page)
  }
}
