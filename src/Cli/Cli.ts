import { Args, parse } from "https://deno.land/std@0.100.0/flags/mod.ts"
import { log } from "../Core/mod.ts"

// interface to cli i/o
export class Cli {
  // -- props --
  #args: Args

  // -- lifetime --
  constructor(args: Args) {
    this.#args = args
  }

  // -- commands --
  // prints the usage and exits
  usage() {
    this.#hdoc(`
      usage:
        www [options] <src>

      args:
        src  the path to the src directory

      options:
        -h, --help  prints this message
        -u, --up    starts the file server
        -p, --prod  starts in production

      environment:
        PROD=1  starts in production
    `)

    Deno.exit(1)
  }

  // -- c/helpers
  // draws a heredoc string; trims whitespace and leading padding
  #hdoc(str: string) {
    // detect the leading padding
    let ns = 0
    for (const c of str) {
      if (c === "\n") {
        continue
      } else if (c === " ") {
        ns++
      } else {
        break
      }
    }

    // trim and remove leading padding
    const cleaned = str
      .split("\n")
      .map((l) => l.slice(ns))
      .join("\n")
      .trim()

    // draw the heredoc
    this.#draw(cleaned)
  }

  // draw a string to the console
  #draw(str: string) {
    log.i(str)
  }

  // -- queries --
  // get the parsed args
  get args(): Args {
    return this.#args
  }

  // if the `h/help` flag is set
  get isHelp(): boolean {
    return this.#args.h || this.#args.help
  }

  // if the `u/up` flag is set
  get isServerUp(): boolean {
    return this.#args.u || this.#args.up
  }

  // -- factories --
  // build the cli from raw cmd line args
  static parse(args: string[]) {
    return new Cli(parse(args))
  }
}
