import Gtk from 'gi://Gtk'
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

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
  return `|<tt><b>${value}</b></tt> | <tt>${_(desc)}</tt> | <tt><i>${_(
    ex
  )}</i></tt>\n`
}

export function table(rows) {
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
export function a(ref, label) {
  return ref ? `<a href="${ref}">${_(label)}</a>` : ''
}
export function b(label) {
  return `<b>${_(label)}</b>`
}

export function addBox(box, child) {
  box.append(child)
}

export function useAddRow(main) {
  let row = 0
  return (label, input) => {
    let inputWidget = input

    if (input instanceof Gtk.Switch) {
      inputWidget = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL })
      addBox(inputWidget, input)
    }

    if (label) {
      main.attach(label, 0, row, 1, 1)
      if (inputWidget) main.attach(inputWidget, 1, row, 1, 1)
    } else {
      main.attach(inputWidget, 0, row, 2, 1)
    }

    row++
    return row - 1
  }
}

export function createLabel(label) {
  return new Gtk.Label({
    label: label,
    hexpand: true,
    halign: Gtk.Align.START,
  })
}
