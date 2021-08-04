import { join } from "https://deno.land/std@0.100.0/path/mod.ts"
import { exists } from "https://deno.land/std@0.100.0/fs/mod.ts"

export class Path {
  // -- props --
  #root: string

  // -- lifetime --
  constructor(root: string) {
    this.#root = root
  }

  // -- queries --
  get str(): string {
    return this.#root
  }

  get length(): number {
    return this.#root.length
  }

  async exists(): Promise<boolean> {
    return await exists(this.#root)
  }

  async read(): Promise<string> {
    const buffer = await Deno.readFile(this.#root)
    return new TextDecoder("utf-8").decode(buffer)
  }

  children(): AsyncIterable<Deno.DirEntry> {
    return Deno.readDir(this.#root)
  }

  // -- operators --
  join(...components: string[]): Path {
    return new Path(join(this.#root, ...components))
  }
}
