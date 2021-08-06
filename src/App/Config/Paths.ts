import { Path } from "../../Core/mod.ts"

export class Paths {
  // -- props --
  #root: Path

  // -- lifetime --
  constructor(root: Path) {
    this.#root = root
  }

  // -- queries --
  get src(): Path {
    return this.#root
  }

  get dst(): Path {
    return this.#root.join("dist")
  }

  get cwd(): Path {
    return new Path(this.#root.str, Deno.cwd())
  }
}
