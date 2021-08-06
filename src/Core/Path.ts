import { join } from "https://deno.land/std@0.100.0/path/mod.ts"
import { exists } from "https://deno.land/std@0.100.0/fs/mod.ts"

// a file path relative path support and file system methods
export class Path {
  // -- props --
  #path: string
  #base: string

  // -- lifetime --
  constructor(path: string, base: string = "") {
    this.#path = path
    this.#base = base
  }

  // -- queries --
  // the entire path
  get str(): string {
    return join(this.#base, this.#path)
  }

  // the relative part of the path
  get relative(): string {
    return this.#path
  }

  // the length of the entire path
  get length(): number {
    return this.str.length
  }

  // -- operators --
  // add components to the relative path
  join(...components: string[]): Path {
    const path = join(this.#path, ...components)
    return new Path(path, this.#base)
  }

  // resolve relative path against another path
  resolve(path: Path): Path {
    return new Path(path.#path, this.str)
  }

  // -- factories --
  // init a new base path; useful for building relative paths w/ `join`.
  static base(str: string): Path {
    return new Path("", str)
  }

  // -----------------
  // ~~ file system ~~
  // -----------------

  // -- commands --
  // copy to the dst path
  async copy(dst: Path): Promise<void> {
    await Deno.copyFile(this.str, dst.str)
  }

  // create a symlink to the dst path (best if callee is absolute)
  async symlink(
    dst: Path,
    options: Deno.SymlinkOptions = { type: "file" },
  ): Promise<void> {
    await Deno.symlink(this.str, dst.str, options)
  }

  // removes the file; defaults to recursive
  async rm(
    options: Deno.RemoveOptions = { recursive: true },
  ): Promise<void> {
    await Deno.remove(this.str, options)
  }

  // makes a directory; defaults to recursive
  async mkdir(
    options: Deno.MkdirOptions = { recursive: true },
  ): Promise<void> {
    await Deno.mkdir(this.str, options)
  }

  // -- queries --
  // checks if something exists at this path
  async exists(): Promise<boolean> {
    return await exists(this.str)
  }

  // reads the contents of the path as a string
  async read(): Promise<string> {
    const buffer = await Deno.readFile(this.str)
    return new TextDecoder("utf-8").decode(buffer)
  }

  // gets any children at this path
  children(): AsyncIterable<Deno.DirEntry> {
    return Deno.readDir(this.str)
  }
}
