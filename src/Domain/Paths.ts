import { Path } from "./Path.ts"

export class Paths {
  // -- props --
  private root: Path

  // -- lifetime --
  constructor(root: Path) {
    this.root = root
  }

  // -- queries --
  get src(): Path {
    return this.root
  }

  get dst(): Path {
    return this.root.join("dist")
  }
}
