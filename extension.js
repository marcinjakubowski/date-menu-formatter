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

const { Clutter, St } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { SimpleDateFormat } = Me.imports.lib.SimpleDateFormat;
const Utils = Me.imports.utils;
const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const StatusArea = Main.panel.statusArea


let PATTERN = "";
let USE_DEFAULT_LOCALE = true
let CUSTOM_LOCALE = ""
let LOCALE = Utils.getCurrentLocale()
let REMOVE_MESSAGES_INDICATOR = false
let FONT_SIZE = 1;

class Extension {
    constructor() {
        // there has to be a better way
        this._display = new St.Label({ style: 'font-size: 9pt; text-align: center' })
        this._display.set_x_align(Clutter.ActorAlign.CENTER)
        this._display.set_y_align(Clutter.ActorAlign.CENTER)
        this._display.text = "..."
        this._timerId = -1
        this._settingsChangedId = null
        this._formatter = null
    }

    _loadSettings() {
        this._settings = ExtensionUtils.getSettings();
        this._settingsChangedId = this._settings.connect('changed', this._onSettingsChange.bind(this));
        this._onSettingsChange()
    }

    _fetchSettings() {
        PATTERN = Utils.convertToPattern(this._settings.get_string(Utils.PrefFields.PATTERN));
        REMOVE_MESSAGES_INDICATOR = this._settings.get_boolean(Utils.PrefFields.REMOVE_MESSAGES_INDICATOR);
        USE_DEFAULT_LOCALE = this._settings.get_boolean(Utils.PrefFields.USE_DEFAULT_LOCALE);
        CUSTOM_LOCALE = this._settings.get_string(Utils.PrefFields.CUSTOM_LOCALE);
        FONT_SIZE = this._settings.get_int(Utils.PrefFields.FONT_SIZE);
        const locale = USE_DEFAULT_LOCALE ? Utils.getCurrentLocale() : CUSTOM_LOCALE
        this._formatter = new SimpleDateFormat(locale)
    }

    _removeIndicator() {
        StatusArea.dateMenu.get_children()[0].remove_child(StatusArea.dateMenu._indicator);
    }
    _restoreIndicator() {
        StatusArea.dateMenu.get_children()[0].insert_child_at_index(StatusArea.dateMenu._indicator, 2);
    }

    _onSettingsChange() {
        this._fetchSettings();
        REMOVE_MESSAGES_INDICATOR ? this._removeIndicator() : this._restoreIndicator()
        this._display.style = `font-size: ${FONT_SIZE}pt; text-align: center`
    }    

    enable() {
        this._loadSettings();
        StatusArea.dateMenu.get_children()[0].insert_child_at_index(this._display, 1);
        StatusArea.dateMenu.get_children()[0].remove_child(StatusArea.dateMenu._clockDisplay);
        this._timerId = Mainloop.timeout_add_seconds(1, this.update.bind(this))
        this.update()
    }

    update() {
        try {
            this._display.text = Utils.convertFromPattern(this._formatter.format(PATTERN, new Date()))
        }
        // if there is an exception during formatting, use the default display's text
        catch (e) {
            this._display.text = StatusArea.dateMenu._clockDisplay.text
            log("DateMenuFormatter: " + e.message)

        }
        return true;
    }

    disable() {
        StatusArea.dateMenu.get_children()[0].insert_child_at_index(StatusArea.dateMenu._clockDisplay, 1);
        StatusArea.dateMenu.get_children()[0].remove_child(this._display);
        this._restoreIndicator()
        Mainloop.source_remove(this._timerId)
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        this._settings = null;
    }
}

function init() {
    return new Extension();
}
