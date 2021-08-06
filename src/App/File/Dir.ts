import { Path } from "../../Core/mod.ts"

export class Dir {
  // -- kind --
  readonly kind = "dir"

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
