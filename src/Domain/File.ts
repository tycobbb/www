import { Path } from "../Core/mod.ts"

export class File {
  // -- kind --
  readonly kind = "file"

  // -- props --
  #path: Path

  // -- lifetime --
  constructor(path: Path) {
    this.#path = path
  }

  // -- queries --
  get path(): Path {
    return this.#path
  }
}
