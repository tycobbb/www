import { Path } from "../../Core/mod.ts"
import { File, FileRef } from "../File/mod.ts"

// -- types --
export type Event
  = { kind: "copy-dir", file: FileRef }
  | { kind: "copy-file", file: FileRef }
  | { kind: "delete-file", file: Path }
  | { kind: "save-file", file: File }

// -- factories --
export const Event = {
  // an event to copy a directory
  copyDir(file: FileRef): Event {
    return { kind: "copy-dir", file }
  },

  // an event to copy a file
  copyFile(file: FileRef): Event {
    return { kind: "copy-file", file }
  },

  // an event to delete a file
  deleteFile(file: Path): Event {
    return { kind: "delete-file", file }
  },

  // an event to save a file w/ text
  saveFile(file: File): Event {
    return { kind: "save-file", file }
  },
}