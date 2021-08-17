import { Args, parse } from "https://deno.land/std@0.100.0/flags/mod.ts"
import { Events, EventStream } from "../App/mod.ts"
import { Log, LogLevel, log } from "./Log.ts"

// interface to cli i/o
export class Cli {
  // -- deps --
  #evts: Events

  // -- props --
  #args: Args

  // -- lifetime --
  constructor(
    args: Args,
    evts: Events = EventStream.get(),
  ) {
    this.#evts = evts
    this.#args = args

    // set log level asap
    Log.set(this.isVerbose ? LogLevel.Debug : LogLevel.Info)
  }

  // -- commands --
  // prints the usage and exits
  usage() {
    log.i(this.#hdoc(`
      usage:
        www [options] <src>

      args:
        src  the path to the src directory

      options:
        -h, --help     prints this message
        -v, --verbose  prints more logs
        -u, --up       starts the file server
        -p, --prod     starts in production

      environment:
        PROD=1  starts in production
    `))

    Deno.exit(1)
  }

  // starts listening for output
  start() {
    this.#evts.on((e) => {
      switch (e.kind) {
      case "copy-dir": // falls through
      case "copy-file":
        log.d(`- copy: ${e.file.relative}`); break
      case "delete-file":
        log.i(`- delete: ${e.file.relative}`); break
      case "save-file":
        log.i(`- update: ${e.file.path.relative}`); break
      default: break
      }
    })
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

  // if the `v/verbose` flag is set
  get isVerbose(): boolean {
    return this.#args.v || this.args.verbose
  }

  // if the `u/up` flag is set
  get isServerUp(): boolean {
    return this.#args.u || this.#args.up
  }

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
    return cleaned
  }

  // -- factories --
  // build the cli from raw cmd line args
  static parse(args: string[]) {
    return new Cli(parse(args))
  }
}
