import { join, relative } from "https://deno.land/std@0.122.0/path/mod.ts"

// -- impls --
/// a file path relative path support and file system methods
export class Path {
  // -- props --
  /// the relative path w/o extension
  #frag: string

  /// the base path, if any
  #base: string

  /// the extension, if any
  #ext: string

  // -- lifetime --
  constructor(path: string, base: string = "", ext: string = "") {
    // set props
    this.#base = base
    this.#frag = path
    this.#ext = ext

    // separate path and extension if present
    if (ext === "") {
      const i = path.indexOf(".")

      if (i >= 0) {
        this.#frag = path.slice(0, i)
        this.#ext = path.slice(i)
      }
    }
  }

  // -- queries --
  // the entire path
  get str(): string {
    return join(this.#base, this.rel)
  }

  /// the relative path w/ extension
  get rel(): string {
    return this.#frag + this.#ext
  }

  /// the relative path w/o extension
  get frag(): string {
    return this.#frag
  }

  /// the extension, if any
  get ext(): string {
    return this.#ext
  }

  // the length of the entire path
  get length(): number {
    return this.str.length
  }

  // -- operators --
  // sets the relative part of the path
  set(path: string, ext: string = ""): Path {
    return new Path(path, this.#base, ext)
  }

  // sets the path extension
  setExt(next: string): Path {
    return this.set(this.#frag, "." + next)
  }

  // set the base path for this path
  setBase(base: Path): Path {
    return new Path(this.#frag, base.str, this.#ext)
  }

  // add components to the relative path
  join(...components: string[]): Path {
    return new Path(join(this.#frag, ...components), this.#base)
  }

  // -- factories --
  // init a new base path; useful for building relative paths w/ `join`.
  static base(str: string): Path {
    return new Path("", str)
  }

  // resolves the string as a path relative to this path
  static resolve(path: string, base: Path) {
    const root = base.str
    return new Path(relative(root, path), root)
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
