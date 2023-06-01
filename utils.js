const Gettext = imports.gettext
const { GLib } = imports.gi
const _ = Gettext.domain('date-menu-formatter').gettext
var PrefFields = {
  FORMATTER: 'formatter',
  PATTERN: 'pattern',
  UPDATE_LEVEL: 'update-level',
  USE_DEFAULT_LOCALE: 'use-default-locale',
  CUSTOM_LOCALE: 'custom-locale',
  USE_DEFAULT_CALENDAR: 'use-default-calendar',
  CUSTOM_CALENDAR: 'custom-calendar',
  USE_DEFAULT_TIMEZONE: 'use-default-timezone',
  CUSTOM_TIMEZONE: 'custom-timezone',
  FONT_SIZE: 'font-size',
  APPLY_ALL_PANELS: 'apply-all-panels',
  REMOVE_MESSAGES_INDICATOR: 'remove-messages-indicator',
}

function getCurrentLocale() {
  return new Intl.DateTimeFormat().resolvedOptions().locale
}
function getCurrentTimezone() {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone
}
function getCurrentCalendar() {
  return new Intl.DateTimeFormat().resolvedOptions().calendar
}

function updateLevel(lvl) {
  if (typeof lvl === 'number' && !Number.isNaN(lvl)) {
    if (lvl === 0)
      return { lvl, priority: GLib.PRIORITY_DEFAULT_IDLE, timeout: 1000 * 60 }
    if (lvl > 0 && lvl <= 7)
      return { lvl, priority: GLib.PRIORITY_DEFAULT, timeout: 1000 / lvl }
    if (lvl > 7 && lvl <= 15)
      return { lvl, priority: GLib.PRIORITY_HIGH, timeout: 1000 / lvl }
  }
  return { lvl: 1, priority: GLib.PRIORITY_DEFAULT, timeout: 1000 }
}

function updateLevelToString(lvl) {
  if (typeof lvl === 'number' && !Number.isNaN(lvl)) {
    if (lvl === 0) return `every minute`
    if (lvl === 1) return `every second`
    if (lvl > 1 && lvl <= 15) return `${lvl} times in a second`
  }
  return `every second`
}

function findPadSize(rows) {
  let maxSize = []
  for (const row of rows) {
    row.forEach((col, i) => {
      if (typeof maxSize[i] !== 'number') maxSize[i] = 0
      if (col.length > maxSize[i]) maxSize[i] = col.length
    })
  }
  return maxSize
}
function row(value, desc, ex) {
  return `<tt><b>${value}</b></tt> | <tt>${_(desc)}</tt> | <i>${_(ex)}</i>\n`
}
function table(rows) {
  const [patternPad, descriptionPad, examplePad] = findPadSize(rows)
  return `\n\n${rows.reduce(
    (acc, [pattern, description, example]) =>
      acc +
      row(
        pattern.padEnd(patternPad),
        description.padEnd(descriptionPad),
        example.padStart(examplePad)
      ),
    ''
  )}`
}
function a(ref, label) {
  return ref ? `<a href="${ref}">${_(label)}</a>` : ''
}
function b(label) {
  return `<b>${_(label)}</b>`
}

class BaseFormatter {
  constructor(timezone, locale, calendar) {
    this.config(timezone, locale, calendar)
  }

  config(timezone, locale, calendar) {}

  format(pattern, date) {}
}

function createFormatter(formatterName, formatterDescription, {customTimezone, customLocale, customCalendar} = {}) {
  return class CustomFormatter extends BaseFormatter {
    static fName = formatterName || ''
    static description = formatterDescription || ''
    static can = Object.freeze({
      customTimezone: !!customTimezone,
      customLocale: !!customLocale,
      customCalendar: !!customCalendar
    })
  }
}
