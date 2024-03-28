import { DateTime } from '../lib/luxon.js'
import { createFormatter, FormatterHelp } from '../utils/formatter.js'

export default class extends createFormatter('Luxon', '', {
  customTimezone: true,
  customLocale: true,
  customCalendar: true,
}) {
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
        outputCalendar: this._calendar,
      })
      .toFormat(pattern.replaceAll('\\n', '\n'))
  }
}

export function help() {
  return new FormatterHelp(
    'https://moment.github.io/luxon/#/formatting?id=table-of-tokens',
    [
      ['y', 'year', '2023'],
      ['yy', 'year (2 digits only)', '23'],
      ['', '', ''],
      ['M', 'month (numeric)', '4'],
      ['MM', 'month (numeric, padded)', '04'],
      ['MMM', 'month (short)', 'Apr'],
      ['MMMM', 'month (full)', 'April'],
      ['MMMMM', 'month (narrow)', 'A'],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['kk', 'ISO week year', '14'],
      ['kkkk', 'ISO week year (padded to 4)', '2014'],
      ['W', 'ISO week number', '32'],
      ['WW', 'ISO week number (padded to 2)', '32'],
      ['', '', ''],
      ['d', 'day of month', '7'],
      ['dd', 'day of month (padded)', '07'],
      ['o', 'day of year (unpadded)', '98'],
      ['ooo', 'day of year (padded to 3)', '002'],
      ['', '', ''],
      ['s', 'second (unpadded)', '4'],
      ['ss', 'second (padded to 2)', '04'],
      ['', '', ''],
      ["'text'", 'literal text', ''],
    ],
    [
      ['E', 'weekday (numeric)', '1-7'],
      ['EEE', 'weekday (abbrev.)', 'Tue'],
      ['EEEE', 'weekday (full)', 'Tuesday'],
      ['EEEEE', 'weekday (narrow)', 'T'],
      ['', '', ''],
      ['h', 'hour', '1-12'],
      ['hh', 'hour (padded)', '01-12'],
      ['H', 'hour', '0-23'],
      ['HH', 'hour (padded)', '00-23'],
      ['a', 'AM-PM', ''],
      ['', '', ''],
      ['ii', 'Local week year', '14'],
      ['iiii', 'Local week year (padded to 4)', '2014'],
      ['n', 'Local week number', '32'],
      ['nn', 'Local week number (padded to 2)', '32'],
      ['', '', ''],
      ['m', 'minute', '7'],
      ['mm', 'minute (padded)', '07'],
      ['', '', ''],
      ['q', 'quarter', '3'],
      ['qq', 'quarter (padded)', '03'],
      ['', '', ''],
      ['S', 'millisecond (unpadded)', '4'],
      ['SSS', 'millisecond (padded to 3)', '004'],
      ['', '', ''],
      ['\\n', 'new line', ''],
    ]
  )
}
