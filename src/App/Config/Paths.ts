import { Path } from "../../Core/mod.ts"

export class Paths {
  // -- props --
  // the root path
  readonly #root: Path

  // the dist (build) path
  readonly #dist: Path

  // -- lifetime --
  // create the path struct
  constructor(
    root: Path,
    dist: Path,
  ) {
    this.#root = root
    this.#dist = dist
  }

  // -- queries --
  get src(): Path {
    return this.#root
  }

  get dst(): Path {
    return this.#dist
  }

  get cwd(): Path {
    return new Path(this.#root.str, Deno.cwd())
  }
}
