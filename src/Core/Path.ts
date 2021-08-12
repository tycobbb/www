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

  // the file extension, if one exists
  extension(): string | null {
    return this.components()?.[1] || null
  }

  // the [path, extension] of the relative path, if possible
  components(): [string, string] | null {
    // if relative part has a path and extension
    const match = this.#path.match(/([^\.]*)(\..*)/)
    if (match == null || match.length !== 3) {
      return null
    }

    // return them as a tuple
    return [match[1], match[2]]
  }

  // -- operators --
  // sets the relative part of the path
  set(path: string): Path {
    return new Path(path, this.#base)
  }

  // add components to the relative path
  join(...components: string[]): Path {
    return this.set(join(this.#path, ...components))
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

  // -- debugging --
  toString(): string {
    return this.str
  }

  // -----------------
  // ~~ file system ~~
  // -----------------

  // -- commands --
  // copy to the dst path
  async copy(dst: Path) {
    await Deno.copyFile(this.str, dst.str)
  }

  // create a symlink to the dst path (best if callee is absolute)
  async symlink(
    dst: Path,
    options: Deno.SymlinkOptions = { type: "file" },
  ) {
    await Deno.symlink(this.str, dst.str, options)
  }

  // removes the file; defaults to recursive
  async rm(
    options: Deno.RemoveOptions = { recursive: true },
  ) {
    await Deno.remove(this.str, options)
  }

  // makes a directory; defaults to recursive
  async mkdir(
    options: Deno.MkdirOptions = { recursive: true },
  ) {
    await Deno.mkdir(this.str, options)
  }

  // reads the contents of the path as a string
  async write(text: string) {
    const data = new TextEncoder().encode(text)
    await Deno.writeFile(this.str, data)
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
