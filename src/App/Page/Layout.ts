import { Path } from "../../Core/mod.ts"
import { Partial, Vars } from "./Partial.ts"

// a layout (.l.html) that specifies the structure for a set of pages
export class Layout {
  // -- props --
  #path: Path
  #dirty: boolean
  #partial: Partial

  // -- lifetime --
  constructor(path: Path, partial: Partial) {
    this.#path = path
    this.#dirty = true
    this.#partial = partial
  }

  // -- commands --
  // mark the layout as dirty
  mark() {
    this.#dirty = true
  }

  // rebuild the layout's partial
  rebuild(partial: Partial) {
    this.#partial = partial
  }

  // parse the layout
  async parse() {
    // read file to string
    const text = await this.#path.read()

    // parse partial
    this.#partial = Partial.parse(text)
  }

  // compile the layout, producing an html string
  compile(vars: Vars): string {
    if (this.#partial == null) {
      throw new Error("must `parse` layout before compiling")
    }

    return this.#partial.bind(vars).compile()
  }
  // -- queries --
  // if the layout is dirty
  get isDirty(): boolean {
    return this.#dirty
  }
}
