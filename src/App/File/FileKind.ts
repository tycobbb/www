import { Path } from "../../Core/mod.ts"

// -- types --
// the type of file this is
export type FileType
  = "dir"
  | "file"
  | "layout"
  | "page"
  | "fragment"
  | "data"

// the kind of file; its type and extension
export class FileKind {
  // -- props --
  // the file node type
  type: FileType

  // the format; the raw extension (e.g. "html")
  format: string

  // -- lifetime --
  // creates a new file kind
  constructor(type: FileType, format: string) {
    this.type = type
    this.format = format
  }

  // -- factories --
  // detects the kind from the path; can't detect directories
  static fromPath(path: Path): FileKind {
    const ext = path.ext
    if (ext == null || ext.length === 0) {
      return new FileKind("file", "")
    }

    // detect type
    let type: FileType
    switch (ext[0]) {
    case "p":
      type = "page"; break
    case "l":
      type = "layout"; break
    case "f":
      type = "fragment"; break
    case "d":
      type = "data"; break
    default:
      type = "file"; break
    }

    // detect format; nodes drop the type prefix
    let format: string[] = ext
    if (type !== "file") {
      format = ext.slice(1)
    }

    // create file kind
    return new FileKind(type, format.join("."))
  }
}