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
