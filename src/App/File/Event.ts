import { File, FileRef } from "./File.ts"

// -- types --
export type FileEvent
  = { kind: "copy-dir", file: FileRef }
  | { kind: "copy-file", file: FileRef }
  | { kind: "delete-file", file: FileRef }
  | { kind: "save-file", file: File }

// -- factories --
export const FileEvent = {
  copyDir(file: FileRef): FileEvent {
    return { kind: "copy-dir", file }
  },

  copyFile(file: FileRef): FileEvent {
    return { kind: "copy-file", file }
  },

  deleteFile(file: FileRef): FileEvent {
    return { kind: "delete-file", file }
  },

  saveFile(file: File): FileEvent {
    return { kind: "save-file", file }
  }
}
