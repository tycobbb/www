import { join } from "https://deno.land/std@0.100.0/path/mod.ts"
import { exists } from "https://deno.land/std@0.100.0/fs/mod.ts"

export class Path {
  // -- props --
  #path: string
  #base: string

  // -- lifetime --
  constructor(path: string, base: string = "") {
    this.#path = path
    this.#base = base
  }

  // -- commands --
  async copy(dst: Path): Promise<void> {
    await Deno.copyFile(this.str, dst.str)
  }

  async symlink(
    dst: Path,
    options: Deno.SymlinkOptions = { type: "file" },
  ): Promise<void> {
    await Deno.symlink(this.str, dst.str, options)
  }

  async rm(
    options: Deno.RemoveOptions = { recursive: true },
  ): Promise<void> {
    await Deno.remove(this.str, options)
  }

  async mkdir(
    options: Deno.MkdirOptions = { recursive: true },
  ): Promise<void> {
    await Deno.mkdir(this.str, options)
  }

  // -- queries --
  get str(): string {
    return join(this.#base, this.#path)
  }

  get relative(): string {
    return this.#path
  }

  get length(): number {
    return this.str.length
  }

  // -- q/fs
  async exists(): Promise<boolean> {
    return await exists(this.str)
  }

  async read(): Promise<string> {
    const buffer = await Deno.readFile(this.str)
    return new TextDecoder("utf-8").decode(buffer)
  }

  children(): AsyncIterable<Deno.DirEntry> {
    return Deno.readDir(this.str)
  }

  // -- operators --
  join(...components: string[]): Path {
    const path = join(this.#path, ...components)
    return new Path(path, this.#base)
  }

  resolve(path: Path): Path {
    return new Path(path.#path, this.str)
  }

  // -- factories --
  static base(str: string): Path {
    return new Path("", str)
  }
}
