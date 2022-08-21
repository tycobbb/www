import { join, relative } from "https://deno.land/std@0.122.0/path/mod.ts"

// -- impls --
/// a file path relative path support and file system methods
export class Path {
  // -- props --
  /// the relative path w/o extension
  #frag: string

  /// the base path, if any
  #base: string

  /// the extension components, if any
  #ext: string[] | null

  // -- lifetime --
  constructor(
    frag: string,
    base: string,
    ext: string[] | null = null
  ) {
    // set props
    this.#frag = frag
    this.#base = base
    this.#ext = ext
  }

  // -- queries --
  // the entire path
  get str(): string {
    return join(this.#base, this.rel)
  }

  /// the relative path w/ extension
  get rel(): string {
    if (this.#ext === null) {
      return this.#frag
    } else {
      return [this.#frag, ...this.#ext].join(".")
    }
  }

  /// the relative path w/o extension
  get frag(): string {
    return this.#frag
  }

  /// the extension, if any
  get ext(): string[] | null {
    return this.#ext
  }

  // the length of the entire path
  get length(): number {
    return this.str.length
  }

  // -- operators --
  // sets the path extension
  setExt(ext: string): Path {
    return new Path(this.#frag, this.#base, [ext])
  }

  // set the base path for this path
  setBase(base: Path): Path {
    return new Path(this.#frag, base.str, this.#ext)
  }

  // add components to the relative path
  join(...components: string[]): Path {
    if (this.#ext != null) {
      throw new Error("tried to join to a path with an extension")
    }

    return Path.raw(
      join(this.#frag, ...components),
      this.#base
    )
  }

  // -- factories --
  // create a new base path; useful for building relative paths w/ `join`.
  static base(base: string): Path {
    return new Path("", base, null)
  }

  // resolves the string as a raw path relative to the base
  static resolve(path: string, base: Path) {
    const root = base.str
    return Path.raw(
      relative(root, path),
      root
    )
  }

  // creates a path from a raw string and base path; parses its extension
  static raw(path: string, base: string = "") {
    let i = 0
    let isExt = false

    while (i >= 0 && !isExt) {
      i = path.indexOf(".", i)
      isExt = i !== 0 && path[i - 1] !== "/"

      // if this is a hidden file (leading ".", try again from the next character)
      if (!isExt) {
        i = i + 1
      }
    }

    // if no extension, the raw path is a fragment
    if (!isExt) {
      return new Path(path, base, null)
    }

    // parse fragment and extension
    const frag = path.slice(0, i)
    const ext = path.slice(i + 1).split(".")

    // and produce the path
    return new Path(frag, base, ext)
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
