import { Path } from "../../Core/mod.ts"

export class Template {
  // -- props --
  #path: Path

  // -- lifetime --
  constructor(path: Path) {
    this.#path = path
  }
}
