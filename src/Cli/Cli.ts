import { Args, parse } from "https://deno.land/std@0.100.0/flags/mod.ts"
import { log } from "../Core/mod.ts"

export class Cli {
  // -- props --
  #args: Args

  // -- lifetime --
  constructor(args: Args) {
    this.#args = args
  }

  // -- commands --
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

  #draw(str: string) {
    log.i(str)
  }

  // -- queries --
  get args(): Args {
    return this.#args
  }

  get isHelp(): boolean {
    return this.#args.h || this.#args.help
  }

  get isUp(): boolean {
    return this.#args.u || this.#args.up
  }

  // -- factories --
  static parse(args: string[]) {
    return new Cli(parse(args))
  }
}
