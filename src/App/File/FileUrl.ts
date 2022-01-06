import { posix } from "https://deno.land/std@0.105.0/path/mod.ts"

// a file request url
export class FileUrl {
  // -- props --
  // the request url for the file
  #url: URL

  // -- lifetime --
  // create a url from the request path
  constructor(path: string) {
    this.#url = new URL(decodeURI(path), "https://unused.xyz")
  }

  // -- queries --
  // find an ordered list of paths in a directory
  findPaths(dir: string): string[] {
    const path = this.#url.pathname

    // resolve root to the index page
    if (path === "/") {
      return [
        posix.join(dir, "index.html")
      ]
    }

    // treat anything w/o an extension as html file
    if (posix.extname(path) === "") {
      return [
        posix.join(dir, path + ".html"),
        posix.join(dir, path, "index.html")
      ]
    }

    // otherwise, resolve the file directly
    return [
      posix.join(dir, path)
    ]
  }
}