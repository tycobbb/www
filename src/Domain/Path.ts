import { join } from "https://deno.land/std@0.100.0/path/mod.ts"
import { exists } from "https://deno.land/std@0.100.0/fs/mod.ts"

export class Path {
  // -- props --
  private root: string

  // -- lifetime --
  constructor(root: string) {
    this.root = root
  }

  // -- queries --
  get str(): string {
    return this.root
  }

  get length(): number {
    return this.root.length
  }

  async exists(): Promise<boolean> {
    return await exists(this.root)
  }

  // -- operators --
  join(...components: string[]): Path {
    return new Path(join(this.root, ...components))
  }
}
