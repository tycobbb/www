import { Path } from "../../Core/mod.ts"

// a ref to an existing file
export type FileRef
  = Path

// a file with a src path and text
export type File = {
  path: Path,
  text: string,
}
