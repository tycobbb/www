import { Path } from "../../Core/mod.ts"

export class Flat {
  // -- kind --
  readonly kind = "flat"

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
