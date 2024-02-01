import GLib from 'gi://GLib'

export const TEXT_ALIGN_START = 'left'
export const TEXT_ALIGN_CENTER = 'center'
export const TEXT_ALIGN_END = 'right'

function currentOptions() {
  return new Intl.DateTimeFormat().resolvedOptions()
}

export function getCurrentLocale() {
  return currentOptions().locale
}
export function getCurrentTimezone() {
  return currentOptions().timeZone
}
export function getCurrentCalendar() {
  return currentOptions().calendar
}

export function updateLevel(lvl) {
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

export function updateLevelToString(lvl) {
  if (typeof lvl === 'number' && !Number.isNaN(lvl)) {
    if (lvl === 0) return `every minute`
    if (lvl === 1) return `every second`
    if (lvl > 1 && lvl <= 15) return `${lvl} times in a second`
  }
  return `every second`
}
