import { Path } from "../../Core/mod.ts"
import { Partial, Vars } from "./Partial.ts"

// a layout (.l.html) that specifies the structure for a set of pages
export class Layout {
  // -- props --
  #dirty: boolean
  #partial: Partial

  // -- lifetime --
  constructor(_: Path, partial: Partial) {
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

  // compile the layout, producing an html string
  compile(vars: Vars): string {
    this.#dirty = false
    const text = this.#partial.bind(vars).compile()
    return text
  }

  // -- queries --
  // if the layout is dirty
  get isDirty(): boolean {
    return this.#dirty
  }
}
