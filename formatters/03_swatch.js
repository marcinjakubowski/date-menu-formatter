const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const { DateTime } = Me.imports.lib.luxon.exports
const { createFormatter } = Me.imports.utils

var Formatter = class Formatter extends createFormatter('Swatch Beats') {
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

var help = {
  left: [['b', 'Beats', '@500']],
  right: [['s', 'Sub Beats', '.12']],
}
