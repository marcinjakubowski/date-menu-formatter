import { DateTime } from '../lib/luxon.js'
import { createFormatter, FormatterHelp } from '../utils/formatter.js'

export default class extends createFormatter('Swatch Beats') {
  config(_, locale, calendar) {
    this._locale = locale
    this._calendar = calendar
  }
  format(pattern, date) {
    const dateTime = DateTime.fromJSDate(date)
      .setZone('UTC+1') //fixed as in beats swatch specs
      .reconfigure({
        locale: this._locale,
        outputCalendar: this._calendar,
      })
    const timeInSeconds =
      (dateTime.hour * 60 + dateTime.minute) * 60 + dateTime.second
    // there are 86.4 seconds in a beat
    const secondsInABeat = 86.4
    // calculate beats to two decimal places
    const [beats, subbeats] = Math.abs(timeInSeconds / secondsInABeat)
      .toFixed(2)
      .split('.')
    return (pattern || '@bbb.s') 
        .replaceAll('bbb',`${beats.padStart(3, '0')}`)
        .replaceAll('b', `${beats}`)
        .replaceAll('s', `${subbeats}`)
  }
}

export function help() {
    return new FormatterHelp(
        '',
        [
            ['b', 'Beats', '90'],
            ['bbb','Beats (Padded)','090']
        ],
        [
            ['s', 'Sub Beats', '12'],
            ['','','']
        ]
    )
}
