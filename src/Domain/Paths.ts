import { Path } from "../Core/mod.ts"

export class Paths {
  // -- props --
  #root: Path
  #ignores: Set<string>

  // -- lifetime --
  constructor(root: Path, ignores: Set<string>) {
    this.#root = root
    this.#ignores = ignores
  }

  // -- queries --
  get src(): Path {
    return this.#root
  }

  get dst(): Path {
    return this.#root.join("dist")
  }

  isIgnored(path: Path): boolean {
    const relative = path.str.slice(this.#root.length - 1)
    return this.#ignores.has(relative)
  }
}
