import { Path } from "../Core/mod.ts"

export interface File {
  kind: "file"
  path: Path
}

export interface Dir {
  kind: "dir"
  path: Path
}

export type Entry = File | Dir
