import { Path, log } from "../../Core/mod.ts"
import { Fatal } from "../Error/mod.ts"
import { Partial, Vars } from "./Partial.ts"

// a layout (.l.html) that specifies the structure for a set of pages
export class Layout {
  // -- props --
  #path: Path
  #dirty: boolean
  #partial: Partial | null

  // -- lifetime --
  constructor(path: Path, partial: Partial | null) {
    this.#path = path
    this.#dirty = true
    this.#partial = partial
  }

  // -- commands --
  // mark the layout as dirty
  mark() {
    if (!this.#dirty) {
      this.#dirty = true
    }
  }

  // rebuild the layout's partial
  rebuild(partial: Partial) {
    this.#partial = partial
  }

  // compile the layout, producing an html string
  compile(vars: Vars): string {
    // if this is a stub, crash
    if (this.#partial == null) {
      throw new Fatal(`missing layout at ${this.#path.relative}`)
    }

    // otherwise, compile the partial
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
