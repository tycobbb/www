import { Path } from "../../Core/mod.ts"
import { Partial, Vars } from "./Partial.ts"

// a layout (.l.html) that specifies the structure for a set of pages
export class Layout {
  // -- props --
  #path: Path
  #partial: Partial | null = null

  // -- lifetime --
  constructor(path: Path) {
    this.#path = path
  }

  // -- commands --
  async parse() {
    // read file to string
    const text = await this.#path.read()

    // parse partial
    this.#partial = Partial.parse(text)
  }

  compile(vars: Vars): string {
    if (this.#partial == null) {
      throw new Error("must `parse` layout before compiling")
    }

    return this.#partial.compile(vars)
  }
}
