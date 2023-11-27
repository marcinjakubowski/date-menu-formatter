import Gio from 'gi://Gio'

Gio._promisify(
  Gio.File.prototype,
  'enumerate_children_async',
  'enumerate_children_finish'
)
function allowedExtension(name, extensions) {
  for (const ext of extensions) {
    if (name.endsWith(`.${ext}`)) return true
  }
  return false
}
function removeExtension(name, extensions) {
  let fname = name
  for (const ext of extensions) fname = fname.replaceAll(`.${ext}`, '')
  return fname
}
async function children(directory) {
  const ret = []
  const children = await directory.enumerate_children_async(
    Gio.FILE_ATTRIBUTE_STANDARD_NAME,
    Gio.FileQueryInfoFlags.NONE,
    0,
    null
  )
  let child = children.next_file(null)
  while (child) {
    ret.push({
      name: child.get_name(),
      type: Object.keys(Gio.FileType)[child.get_file_type()],
    })
    child = children.next_file(null)
  }
  return ret
    .filter(
      ({ type }) =>
        type !== Gio.FileType.REGULAR && type !== Gio.FileType.UNKNOWN
    )
    .map((c) => c.name)
}

export async function importDir(
  dir,
  excludeIndex = false,
  enabledExtension = ['js', 'ts']
) {
  const res = {}
  const directory = Gio.File.new_for_path(dir)
  const files = await children(directory)
  for (const file of files) {
    if (allowedExtension(file, enabledExtension)) {
      const name = removeExtension(file, enabledExtension)
      if (!(excludeIndex && name.toLowerCase() === 'index')) {
        res[name] = await import(`${dir}/${file}`)
      }
    }
  }
  return res
}
