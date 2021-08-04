import { join } from "https://deno.land/std@0.100.0/path/mod.ts"

export class Paths {
  // -- props --
  private root: string

  // -- lifetime --
  constructor(root: string) {
    this.root = root
  }

  // -- queries --
  get src(): string {
    return this.root
  }

  get dst(): string {
    return join(this.root, "dist")
  }
}
