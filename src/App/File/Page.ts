import { Path } from "../../Core/mod.ts"

export class Page {
  // -- props --
  #path: Path

  // -- lifetime --
  constructor(path: Path) {
    this.#path = path
  }
}
