import Gio from 'gi://Gio'

Gio._promisify(
  Gio.File.prototype,
  'enumerate_children_async',
  'enumerate_children_finish'
)
const URI_SCHEMAS = Gio.Vfs.get_local()
  .get_supported_uri_schemes()
  .map((schema) => `${schema}:\\`)

export function isUri(uri) {
  const regex = /^([a-z]+:\/\/)/i
  return regex.test(uri)
}
export function isSupportedUri(uri) {
  for (const schema of URI_SCHEMAS) {
    if (uri.startsWith(schema)) return true
  }
  return false
}

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

export function resolveFile(uri, ...paths) {
  //there is some grave bug in resolving uri and paths
  let file
  if (isUri(uri)) {
    file = Gio.File.new_for_uri(isSupportedUri(uri) ? uri : import.meta.url)
  } else if (uri.startsWith('/')) {
    file = Gio.File.new_for_path(uri)
  } else {
    file = Gio.File.new_for_uri(import.meta.url)
  }
  if (paths.length > 0) {
    for (const path of paths) {
      file = file.resolve_relative_path(path)
    }
  }
  return file
}
export function resolvePath(...paths) {
  const file = resolveFile(...paths)
  return file.get_uri() === import.meta.url ? '' : file.get_path()
}
export function resolveUri(...paths) {
  const file = resolveFile(...paths)
  return file.get_uri() === import.meta.url ? '' : file.get_uri()
}

export async function importDir(
  dir,
  excludeIndex = false,
  enabledExtension = ['js', 'ts']
) {
  const res = {}
  const directory = resolveFile.apply(
    undefined,
    Array.isArray(dir) ? dir : [dir]
  )
  const files = await children(directory)
  for (const file of files) {
    if (allowedExtension(file, enabledExtension)) {
      const name = removeExtension(file, enabledExtension)
      if (!(excludeIndex && name.toLowerCase() === 'index')) {
        res[name] = await import(`${directory.get_uri()}/${file}`)
      }
    }
  }
  return res
}
