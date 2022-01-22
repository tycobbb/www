import { FilePath } from "./FilePath.ts"

// -- types --
// a file with a src path and text
export type File = {
  // the path to the file
  path: FilePath,

  // the text of the file
  text: string,
}