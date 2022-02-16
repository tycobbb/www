import { Path } from "../../Core/mod.ts"

// -- types --
// the kind of file this is
export type FileKind
  = "dir"
  | "file"
  | "layout"
  | "page"
  | "fragment"

// -- impls --
export const FileKind = {
  // detects the kind from the path; can't detect directories
  fromPath(path: Path): FileKind {
    switch (path.ext) {
    case ".p.html":
      return "page"
    case ".l.html":
      return "layout"
    case ".f.html":
      return "fragment"
    default:
      return "file"
    }
  }
}