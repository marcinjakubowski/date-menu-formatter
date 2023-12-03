import { DateTime } from '../lib/luxon.js'
import { createFormatter, FormatterHelp } from '../utils/formatter.js'

export default class extends createFormatter('Swatch Beats') {
  format(pattern, date) {
    const dateTime = DateTime.fromJSDate(date)
      .setZone('Europe/Zurich')
      .setLocale('CH')
    const timeInSeconds =
      (dateTime.hour * 60 + dateTime.minute) * 60 + dateTime.second
    // there are 86.4 seconds in a beat
    const secondsInABeat = 86.4
    // calculate beats to two decimal places
    const [beats, subbeats] = Math.abs(timeInSeconds / secondsInABeat)
      .toFixed(2)
      .split('.')
    return pattern.replaceAll('b', `@${beats}`).replaceAll('s', `.${subbeats}`)
  }
}

export function help() {
  return new FormatterHelp(
  '',
  [['b', 'Beats', '@500']],
  [['s', 'Sub Beats', '.12']]
)
}