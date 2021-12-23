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
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { SimpleDateFormat } = Me.imports.lib.SimpleDateFormat;
const Utils = Me.imports.utils;

const Gettext = imports.gettext;
const _ = Gettext.domain('date-menu-formatter').gettext;

function init() {
    let localeDir = Me.dir.get_child('locale');
    if (localeDir.query_exists(null))
        Gettext.bindtextdomain('date-menu-formatter', localeDir.get_path());
}

function addBox(box, child) {
    if (imports.gi.versions.Gtk.startsWith("3")) {
        box.add(child);
    }
    else {
        box.append(child);
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
            row_homogeneous: false
        });
        
        const addRow = ((main) => {
            let row = 0;
            return (label, input) => {
                let inputWidget = input;

                if (input instanceof Gtk.Switch) {
                    inputWidget = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,});
                    addBox(inputWidget, input);
                }

                if (label) {
                    main.attach(label, 0, row, 1, 1);
                    if (inputWidget)
                        main.attach(inputWidget, 1, row, 1, 1);
                }
                else {
                    main.attach(inputWidget, 0, row, 2, 1);
                }

                row++;
            };
        })(this.main);

        const createLabel = (label) => {
            return new Gtk.Label({
                label: label,
                hexpand: true,
                halign: Gtk.Align.START
            })
        }

        
        const patternLabel = createLabel(_("Pattern"))
        const patternEdit = new Gtk.Entry({ buffer: new Gtk.EntryBuffer() })
        
        const previewLabel = createLabel(_("Preview"))
        const patternPreview = createLabel("")
        
        const useDefaultLocaleLabel = createLabel(_("Use default locale") + ` (${Utils.getCurrentLocale()})`)
        const localeBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 30 })
        const useDefaultLocaleEdit = new Gtk.Switch( { vexpand: false, valign: Gtk.Align.CENTER })
        
        const customLocaleEdit = new Gtk.Entry({ buffer: new Gtk.EntryBuffer() })
        addBox(localeBox, useDefaultLocaleEdit);
        addBox(localeBox, customLocaleEdit);
        
        const removeMessagesIndicatorLabel = createLabel( _("Remove unread messages indicator"))
        const removeMessagesIndicatorEdit = new Gtk.Switch()

        const fontSizeLabel = createLabel(_("Font size"))
        const fontSizeEdit = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 4,
                upper: 30,
                step_increment: 1
            })
        })

        fontSizeEdit.connect('output', function (spin) {
            spin.text = `${spin.value} pt`
            return true
        }.bind(this))


        const applyAllPanelsLabel = createLabel( _("Apply to all panels (Dash to Panel)"))
        const applyAllPanelsEdit = new Gtk.Switch()
        

        addRow(patternLabel, previewLabel)
        addRow(patternEdit, patternPreview)
        addRow(useDefaultLocaleLabel, localeBox)
        addRow(removeMessagesIndicatorLabel, removeMessagesIndicatorEdit)
        addRow(applyAllPanelsLabel, applyAllPanelsEdit)
        addRow(fontSizeLabel, fontSizeEdit);
        addRow(null, new Gtk.Separator())


        const markup_help1 = _(`<b>Available pattern components</b>
<tt>y     </tt> - year
<tt>yy    </tt> - year (2 digits only)

<tt>M     </tt> - month (numeric) <i>4</i>
<tt>MM    </tt> - month (numeric, padded) <i>04</i>
<tt>MMM   </tt> - month (short) <i>Apr</i>
<tt>MMMM  </tt> - month (full) <i>April</i>
<tt>MMMMM </tt> - month (narrow) <i>A</i>

<tt>w     </tt> - week of year
<tt>ww    </tt> - week of year (padded)
<tt>W     </tt> - week of month

<tt>d     </tt> - day of month
<tt>dd    </tt> - day of month (padded)

<tt>'text'</tt> - literal text`)
        const markup_help2 = _(`<a href="https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table">Full list (web)</a>
<tt>EEE   </tt> - weekday (abbrev.) <i>Tue</i>
<tt>EEEE  </tt> - weekday (full) <i>Tuesday</i>
<tt>EEEEE </tt> - weekday (narrow) <i>T</i>
<tt>EEEEEE</tt> - weekday (short) <i>Tu</i>

<tt>h     </tt> - hour (1-12)
<tt>hh    </tt> - hour (1-12, padded)
<tt>k     </tt> - hour (0-23)
<tt>kk    </tt> - hour (00-23, padded)

<tt>m     </tt> - minute
<tt>mm    </tt> - minute (padded)

<tt>aaa   </tt> - period (am/pm)


<tt>\\n    </tt> - new line`)
        const help1 = createLabel("")
        help1.set_markup(markup_help1)

        const help2 = createLabel("")
        help2.set_markup(markup_help2)
        
        addRow(help1, help2)

        const settings = ExtensionUtils.getSettings();
        settings.bind(Utils.PrefFields.PATTERN, patternEdit.buffer, 'text', Gio.SettingsBindFlags.DEFAULT);
        settings.bind(Utils.PrefFields.USE_DEFAULT_LOCALE, useDefaultLocaleEdit, 'active', Gio.SettingsBindFlags.DEFAULT);
        settings.bind(Utils.PrefFields.CUSTOM_LOCALE, customLocaleEdit.buffer, 'text', Gio.SettingsBindFlags.DEFAULT);
        settings.bind(Utils.PrefFields.REMOVE_MESSAGES_INDICATOR, removeMessagesIndicatorEdit, 'active', Gio.SettingsBindFlags.DEFAULT)
        settings.bind(Utils.PrefFields.APPLY_ALL_PANELS, applyAllPanelsEdit, 'active', Gio.SettingsBindFlags.DEFAULT);
        settings.bind(Utils.PrefFields.FONT_SIZE, fontSizeEdit, 'value', Gio.SettingsBindFlags.DEFAULT);
        const sensitivityBindFlags = Gio.SettingsBindFlags.GET | Gio.SettingsBindFlags.NO_SENSITIVITY | Gio.SettingsBindFlags.INVERT_BOOLEAN
        settings.bind(Utils.PrefFields.USE_DEFAULT_LOCALE, customLocaleEdit, 'sensitive', sensitivityBindFlags)

        useDefaultLocaleEdit.connect('state-set', this.generatePreview.bind(this))
        customLocaleEdit.buffer.connect_after('inserted-text', this.generatePreview.bind(this))
        customLocaleEdit.buffer.connect_after('deleted-text', this.generatePreview.bind(this))
        patternEdit.buffer.connect_after('inserted-text', this.generatePreview.bind(this))
        patternEdit.buffer.connect_after('deleted-text', this.generatePreview.bind(this))
        this._pattern = patternEdit.buffer
        this._preview = patternPreview
        this._customLocale = customLocaleEdit.buffer
        this._useDefaultLocale = useDefaultLocaleEdit
        this._previewErrorCount = 0
        this.generatePreview()
    }

    generatePreview() {
        const text = Utils.convertToPattern(this._pattern.text)
        const locale = this._useDefaultLocale.active ? Utils.getCurrentLocale() : this._customLocale.text
        if (text.length > 1) {
            try { 
                this._preview.label = Utils.convertFromPattern((new SimpleDateFormat(locale)).format(text, new Date()))
                this._previewErrorCount = 0                
            }
            catch (e) {
                this._previewErrorCount++
                if (this._previewErrorCount > 2) {
                    if (e.message !== "fmtFn is not a function")
                        this._preview.label = "ERROR: " + e.message
                    else
                        this._preview.label = "ERROR"
                    
                }
            }
        }
        else {
            this._preview.label = ""
            this._previewErrorCount = 0
        }
    }
};

function buildPrefsWidget() {
    let frame = new Gtk.Box();
    let widget = new Preferences();
    addBox(frame, widget.main);
    if (frame.show_all)
	    frame.show_all();
    return frame;
}

