import { SimpleDateFormat } from '../lib/SimpleDateFormat.js'
import { createFormatter, FormatterHelp } from '../utils/formatter.js'

function convertToPattern(str) {
  return '#' + str.replace(/\\n/g, '\n').replace(/''/g, '>`<')
}

function convertFromPattern(str) {
  return str.replace(/>`</g, "'")
}

export default class extends createFormatter('SimpleDateFormat', '', {
  customLocale: true,
}) {
  config(_, locale) {
    this._formatter = new SimpleDateFormat(locale)
  }

  format(pattern, date) {
    return convertFromPattern(
      this._formatter.format(convertToPattern(pattern), date)
    )
  }
}

export function help() {
  return new FormatterHelp(
  'https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table',
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
    ['w', 'week of year', '9'],
    ['ww', 'week of year (padded)', '09'],
    ['W', 'week of month', '2'],
    ['', '', ''],
    ['d', 'day of month', '7'],
    ['dd', 'day of month (padded)', '07'],
    ['', '', ''],
    ["'text'", 'literal text', ''],
  ],
  [
    ['EEE', 'weekday (abbrev.)', 'Tue'],
    ['EEEE', 'weekday (full)', 'Tuesday'],
    ['EEEEE', 'weekday (narrow)', 'T'],
    ['EEEEEE', 'weekday (short)', 'Tu'],
    ['', '', ''],
    ['h', 'hour', '1-12'],
    ['hh', 'hour (padded)', '01-12'],
    ['k', 'hour', '0-23'],
    ['kk', 'hour (padded)', '00-23'],
    ['', '', ''],
    ['m', 'minute', '7'],
    ['mm', 'minute (padded)', '07'],
    ['', '', ''],
    ['aaa', 'period (am/pm)', ''],
    ['', '', ''],
    ['', '', ''],
    ['\\n', 'new line', ''],
  ]
)
}