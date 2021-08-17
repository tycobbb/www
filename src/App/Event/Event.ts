import { File, FileRef } from "../File/mod.ts"

// -- types --
export type Event
  = { kind: "info", message: string }
  | { kind: "warning", message: string }
  | { kind: "copy-dir", file: FileRef }
  | { kind: "copy-file", file: FileRef }
  | { kind: "delete-file", file: FileRef }
  | { kind: "save-file", file: File }

// -- factories --
export const Event = {
  // -- f/io
  info(message: string): Event {
    return { kind: "info", message }
  },

  warning(message: string): Event {
    return { kind: "warning", message }
  },

  // -- f/files
  copyDir(file: FileRef): Event {
    return { kind: "copy-dir", file }
  },

  copyFile(file: FileRef): Event {
    return { kind: "copy-file", file }
  },

  deleteFile(file: FileRef): Event {
    return { kind: "delete-file", file }
  },

  saveFile(file: File): Event {
    return { kind: "save-file", file }
  },
}
