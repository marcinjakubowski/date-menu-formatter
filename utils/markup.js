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
  return `<tt><b>${value}</b></tt> | <tt>${_(desc)}</tt> | <i>${_(ex)}</i>\n`
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
