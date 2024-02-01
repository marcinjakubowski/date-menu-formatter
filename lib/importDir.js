import Gio from 'gi://Gio'

function asGioPromise(obj, methodStart, methodFinish = undefined) {
  methodFinish =
    methodFinish ??
    methodStart.replace('_async', '').replace('_begin', '') + '_finish'
  return function (...args) {
    return new Promise((resolve, reject) => {
      let { stack: callStack } = new Error()
      this[methodStart](...args, function (source, res) {
        try {
          const result =
            source !== null && source[methodFinish] !== undefined
              ? source[methodFinish](res)
              : obj[methodFinish](res)
          if (Array.isArray(result) && result.length > 1 && result[0] === true)
            result.shift()
          resolve(result)
        } catch (error) {
          callStack = callStack
            .split('\n')
            .filter((line) => line.indexOf('_promisify/') === -1)
            .join('\n')
          if (error.stack)
            error.stack += `### Promise created here: ###\n${callStack}`
          else error.stack = callStack
          reject(error)
        }
      })
    })
  }.bind(obj)
}

const URI_SCHEMAS = Gio.Vfs.get_local()
  .get_supported_uri_schemes()
  .map((schema) => `${schema}://`)

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
  const children = await asGioPromise(directory, 'enumerate_children_async')(
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
  //the code work for most cases
  let file
  if (isUri(uri)) {
    file = Gio.File.new_for_uri(isSupportedUri(uri) ? uri : import.meta.url)
  } else if (uri.startsWith('/')) {
    file = Gio.File.new_for_path(uri)
  } else {
    file = Gio.File.new_for_uri(import.meta.url)
    paths.push(uri)
  }
  const fileInfo = file.query_info(
    Gio.FILE_ATTRIBUTE_STANDARD_NAME + ',' + Gio.FILE_ATTRIBUTE_STANDARD_TYPE,
    Gio.FileQueryInfoFlags.NONE,
    null
  )
  if (fileInfo.get_file_type() === Gio.FileType.REGULAR) {
    file = file.get_parent()
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
  dir = Array.isArray(dir) ? dir : [dir]
  const directory = resolveFile(...dir)
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
