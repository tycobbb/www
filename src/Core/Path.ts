import { join, relative } from "https://deno.land/std@0.105.0/path/mod.ts"

// -- constants --
// matches paths with compound extensions (e.g. *.p.html)
const kComponentsPattern = /([^\.]*)(\..*)/

// -- impls --
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
    const match = this.#path.match(kComponentsPattern)
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

  // sets the path extension
  setExt(next: string): Path {
    const m = this

    // get path segment and ext
    const parts = m.components()
    if (parts == null) {
      throw new Error("must have a path and extension")
    }

    // replace the extension
    return m.set(`${parts[0]}.${next}`)
  }

  // add components to the relative path
  join(...components: string[]): Path {
    return this.set(join(this.#path, ...components))
  }

  // rebase relative path against this path
  rebase(path: Path): Path {
    return new Path(path.#path, this.str)
  }

  // resolves the string as a path relative to this path
  resolve(path: string) {
    return new Path(relative(this.str, path), this.str)
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
  // checks if a file exists at this path
  async exists(): Promise<boolean> {
    return await this.stat() != null
  }

  // gets the file info for this path, if a file exists
  async stat(): Promise<Deno.FileInfo | null> {
    try {
      return await Deno.lstat(this.str)
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        return null
      }

      throw err
    }
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
