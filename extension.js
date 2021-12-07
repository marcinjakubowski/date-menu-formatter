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

const { Clutter, Gio, GLib, GObject, Meta, Shell, St } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { SimpleDateFormat } = Me.imports.lib.SimpleDateFormat;
const Utils = Me.imports.utils;
const Mainloop = imports.mainloop;
const Prefs = Me.imports.prefs;
const Main = imports.ui.main;
const StatusArea = Main.panel.statusArea
const Lang = imports.lang;


let PATTERN = "";
let USE_DEFAULT_LOCALE = true
let CUSTOM_LOCALE = ""
let LOCALE = Utils.getCurrentLocale()


class Extension {
    constructor() {
        // there has to be a better way
        this._display = new St.Label({ style: 'font-size: 9pt; text-align: center'})
        this._display.text = "..."
        this._timerId = -1
        this._formatter = null
    }

    _loadSettings() {
        this._settings = Prefs.SettingsSchema;
        this._settingsChangedId = this._settings.connect('changed', this._onSettingsChange.bind(this));
        this._fetchSettings();
    }

    _fetchSettings() {
        PATTERN = '#' + this._settings.get_string(Prefs.Fields.PATTERN).replaceAll("\\n", "\n");
        USE_DEFAULT_LOCALE = this._settings.get_boolean(Prefs.Fields.USE_DEFAULT_LOCALE);
        CUSTOM_LOCALE = this._settings.get_string(Prefs.Fields.CUSTOM_LOCALE);
        const locale = USE_DEFAULT_LOCALE ? Utils.getCurrentLocale() : CUSTOM_LOCALE
        this._formatter = new SimpleDateFormat(locale)
    }

    _onSettingsChange() {
        this._fetchSettings();
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
            this._display.text = this._formatter.format(PATTERN, new Date())
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
        Mainloop.source_remove(this._timerId)
    }
}

function init() {
    return new Extension();
}
