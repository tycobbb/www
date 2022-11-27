import { FilePath } from "./FilePath.ts"
import { FileKind } from "./FileKind.ts"

// -- types --
export type FileRef = {
  // the path to the file
  readonly path: FilePath

  // the kind of the file
  readonly kind: FileKind,
}

// -- impls --
// a reference to a file w/ inferred kind
export const FileRef = {
  // -- lifetime --
  // init a new file ref
  init(path: FilePath, kind: FileKind | null = null) {
    return {
      path,
      kind: kind || FileKind.fromPath(path)
    }
  },
}
