import { Path } from "../../Core/mod.ts"
import { File, FileRef } from "../File/mod.ts"

// -- types --
// an application event
export type Event =
  | {
      name: "copy-dir"
      file: FileRef
    }
  | {
      name: "copy-file"
      file: FileRef
    }
  | {
      name: "delete-file"
      file: Path
    }
  | {
      name: "save-file"
      file: File
    }
  | {
      name: "show-warning"
      msg: string
      cause?: Error
    }

// -- factories --
export const Event = {
  // an event to copy a directory
  copyDir: (file: FileRef): Event => ({
    name: "copy-dir",
    file,
  }),

  // an event to copy a file
  copyFile: (file: FileRef): Event => ({
    name: "copy-file",
    file,
  }),

  // an event to delete a file
  deleteFile: (file: Path): Event => ({
    name: "delete-file",
    file,
  }),

  // an event to save a file w/ text
  saveFile: (file: File): Event => ({
    name: "save-file",
    file,
  }),

  // an event to show a warning
  showWarning: (msg: string, cause?: Error): Event => ({
    name: "show-warning",
    msg,
    cause,
  }),
}
