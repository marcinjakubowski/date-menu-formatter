import { importDir } from '../lib/importDir.js'

export class BaseFormatter {
  constructor(timezone, locale, calendar) {
    this.config(timezone, locale, calendar)
  }

  config(timezone, locale, calendar) {}

  format(pattern, date) {}
}

export function createFormatter(
  formatterLabel,
  formatterDescription,
  { customTimezone, customLocale, customCalendar } = {}
) {
  return class CustomFormatter extends BaseFormatter {
    static label = formatterLabel || ''
    static description = formatterDescription || ''
    static can = Object.freeze({
      customTimezone: !!customTimezone,
      customLocale: !!customLocale,
      customCalendar: !!customCalendar,
    })
  }
}

function freeze(arr) {
  if (!Array.isArray(arr)) return Object.freeze([])
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Object.freeze(arr[i])
  }
  return Object.freeze(arr)
}

export class FormatterHelp {
  #link
  #left
  #right
  constructor(link, left, right) {
    this.#link = typeof link === 'string' && link !== '' ? link : ''
    this.#left = freeze(left)
    this.#right = freeze(right)
  }
  get link() {
    return this.#link
  }
  get left() {
    return this.#left
  }
  get right() {
    return this.#right
  }
}

export class FormatterManager {
  constructor(load = false) {
    this.formatters = {}
    if (load) this.loadFormatters()
  }
  async loadFormatters() {
    this.formatters = await importDir([import.meta.url, '../formatters'])
    return this.formatters
  }

  getFormatter(key) {
    return this.formatters[key] ? this.formatters[key].default : undefined
  }
  getFormatterHelp(key) {
    return this.formatters[key] ? this.formatters[key].help() : undefined
  }

  asList() {
    return Object.keys(this.formatters)
      .filter((f) => !f.startsWith('_'))
      .map((f) => ({
        key: f,
        name: this.getFormatter(f).label,
        description: this.getFormatter(f).description,
      }))
  }
}

export const CALENDAR_LIST = [
  { key: 'gregory', description: '1 March 2010', name: 'Gregorian' },
  { key: 'buddhist', description: 'September 24, 2560 BE', name: 'Buddhist' },
  { key: 'chinese', description: 'Eighth Month 5, 2017', name: 'Chinese' },
  { key: 'coptic', description: 'Tout 14, 1734 ERA1', name: 'Coptic' },
  {
    key: 'ethioaa',
    description: 'Meskerem 14, 7510 ERA0',
    name: 'Ethiopic (Amete Alem)',
  },
  { key: 'ethiopic', description: 'Meskerem 14, 2010 ERA1', name: 'Ethiopic' },
  { key: 'hebrew', description: '4 Tishri 5778', name: 'Hebrew' },
  { key: 'indian', description: 'Asvina 2, 1939 Saka', name: 'Indian' },
  { key: 'islamic', description: 'Muharram 4, 1439 AH', name: 'Islamic' },
  {
    key: 'islamic-civil',
    description: 'Muharram 3, 1439 AH',
    name: 'Islamic Civil',
  },
  { key: 'iso8601', description: 'September 24, 2017', name: 'ISO 8601' },
  { key: 'japanese', description: 'September 24, 29 Heisei', name: 'Japanase' },
  { key: 'persian', description: 'Mehr 2, 1396 AP', name: 'Persian' },
  { key: 'roc', description: 'September 24, 106 Minguo', name: 'Minguo' },
]
