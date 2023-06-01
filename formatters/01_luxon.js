const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { DateTime } = Me.imports.lib.luxon.exports
const { createFormatter } = Me.imports.utils

var Formatter = class Formatter extends createFormatter('Luxon','',{customTimezone: true, customLocale:true, customCalendar: true}) {
  config(timezone, locale, calendar) {
    this._timezone = timezone
    this._locale = locale
    this._calendar = calendar
  }

  format(pattern, date) {
    return DateTime.fromJSDate(date)
      .setZone(this._timezone)
      .reconfigure({
        locale: this._locale,
        outputCalendar: this._calendar
      })
      .toFormat(pattern.replaceAll('\\n', '\n'))
  }
}

var help = {
  link: 'https://moment.github.io/luxon/#/formatting?id=table-of-tokens',
  left: [
    ['y', 'year', '2023'],
    ['yy', 'year (2 digits only)', '23'],
    ['', '', ''],
    ['M', 'month (numeric)', '4'],
    ['MM', 'month (numeric, padded)', '04'],
    ['MMM', 'month (short)', 'Apr'],
    ['MMMM', 'month (full)', 'April'],
    ['MMMMM', 'month (narrow)', 'A'],
    ['', '', ''],
    ['w', 'week of year', '9'],
    ['ww', 'week of year (padded)', '09'],
    ['', '', ''],
    ['d', 'day of month', '7'],
    ['dd', 'day of month (padded)', '07'],
    ['o', 'day of year (unpadded)', '98'],
    ['ooo', 'day of year (padded to 3)', '002'],
    ['', '', ''],
    ["'text'", 'literal text', ''],
  ],
  right: [
    ['E', 'weekday (numeric)', '1-6'],
    ['EEE', 'weekday (abbrev.)', 'Tue'],
    ['EEEE', 'weekday (full)', 'Tuesday'],
    ['EEEEE', 'weekday (narrow)', 'T'],
    ['', '', ''],
    ['h', 'hour', '1-12'],
    ['hh', 'hour (padded)', '1-12'],
    ['H', 'hour', '0-23'],
    ['HH', 'hour (padded)', '00-23'],
    ['a', 'AM-PM', ''],
    ['', '', ''],
    ['m', 'minute', '7'],
    ['mm', 'minute (padded)', '07'],
    ['', '', ''],
    ['q', 'quarter', '3'],
    ['qq', 'quarter (padded)', '03'],
    ['', '', ''],
    ['\\n', 'new line', ''],
  ],
}
